import { parser } from '@prometheus-io/lezer-promql';
import { PrettifyOptions } from './types';

type Node = string | Group | Break;

/** A breakable parenthesized group (function call body or paren expression). */
interface Group {
  children: Node[];
}

/** A binary-operator break point; `op` holds the operator and any vector-matching modifiers. */
interface Break {
  op: string;
}

interface Substitution {
  placeholder: string;
  original: string;
}

const isGroup = (node: Node): node is Group => typeof node !== 'string' && 'children' in node;
const isBreak = (node: Node): node is Break => typeof node !== 'string' && 'op' in node;

/** Matches Grafana template variables: `$__rate_interval`, `$var`, `${var}`, `${var:csv}` and legacy `[[var]]`. */
const TEMPLATE_VARIABLE_REGEX = /\$\{[^}]*\}|\[\[[^\]]+\]\]|\$[A-Za-z_][A-Za-z0-9_]*/g;

/**
 * Returns true when the template variable at `index` sits where PromQL expects
 * a duration: inside a range/subquery selector (after `[` or `:`) or after the
 * `offset` keyword.
 */
const isDurationContext = (expr: string, index: number): boolean => {
  let i = index - 1;
  while (i >= 0 && /\s/.test(expr[i])) {
    i--;
  }
  if (i < 0) {
    return false;
  }
  if (expr[i] === '[' || expr[i] === ':') {
    return true;
  }
  const preceding = expr.slice(0, i + 1);
  return /(^|[^A-Za-z0-9_])offset$/.test(preceding);
};

/**
 * Grafana template variables are not valid PromQL, so they are masked with
 * syntactically valid placeholders before parsing (a duration literal in
 * duration positions, an identifier elsewhere) and restored after rendering.
 * Placeholders have exactly the same length as the variable they replace so
 * that line-width measurements on the masked text match the real output.
 */
const maskTemplateVariables = (expr: string): { masked: string; substitutions: Substitution[] } => {
  const substitutions: Substitution[] = [];
  let counter = 0;
  const nextPlaceholder = (length: number, duration: boolean): string => {
    let candidate: string;
    do {
      const id = String(counter);
      counter++;
      if (duration) {
        // e.g. "000001m" — a zero-padded duration with the same width as the variable
        candidate = id.length + 1 <= length ? `${id.padStart(length - 1, '0')}m` : `${100000 + Number(id)}m`;
      } else {
        // e.g. "v1____" — an identifier padded with underscores to the same width as the variable
        candidate = id.length + 1 <= length ? `v${id}`.padEnd(length, '_') : `__tsqtsq_var_${id}__`;
      }
    } while (expr.includes(candidate));
    return candidate;
  };
  const masked = expr.replace(TEMPLATE_VARIABLE_REGEX, (match, index: number) => {
    const placeholder = nextPlaceholder(match.length, isDurationContext(expr, index));
    substitutions.push({ placeholder, original: match });
    return placeholder;
  });
  return { masked, substitutions };
};

const restoreTemplateVariables = (text: string, substitutions: Substitution[]): string =>
  substitutions.reduce((result, { placeholder, original }) => result.split(placeholder).join(original), text);

/**
 * Parses an expression with the lezer PromQL parser and reduces the syntax
 * tree to a tree of text, breakable parenthesized groups and binary-operator
 * break points. Function call bodies and paren expressions are the only
 * groups that may be broken onto multiple lines; grouping labels (e.g.
 * `by (...)`) stay part of the surrounding text.
 */
const parseExpression = (expr: string): Node[] => {
  const tree = parser.parse(expr);

  // Spans covering each binary operator and its modifiers (from the end of
  // the left operand to the start of the right operand), used as break points.
  const operatorSpans: Array<[number, number]> = [];
  let hasError = false;
  tree.iterate({
    enter: (node) => {
      if (node.type.isError) {
        hasError = true;
        return false;
      }
      if (node.name === 'BinaryExpr') {
        const left = node.node.firstChild;
        const right = node.node.lastChild;
        if (left && right && left.to < right.from) {
          operatorSpans.push([left.to, right.from]);
        }
      }
      return undefined;
    },
  });
  if (hasError) {
    throw new Error('Unable to parse PromQL expression');
  }
  operatorSpans.sort((a, b) => a[0] - b[0]);

  const root: Group = { children: [] };
  const stack: Group[] = [root];
  let pos = 0;

  const pushText = (from: number, to: number) => {
    const current = stack[stack.length - 1];
    let cursor = from;
    for (const [start, end] of operatorSpans) {
      if (start >= cursor && end <= to) {
        if (start > cursor) {
          current.children.push(expr.slice(cursor, start));
        }
        current.children.push({ op: expr.slice(start, end) });
        cursor = end;
      }
    }
    if (to > cursor) {
      current.children.push(expr.slice(cursor, to));
    }
  };

  tree.iterate({
    enter: (node) => {
      if (node.name === 'FunctionCallBody' || node.name === 'ParenExpr') {
        pushText(pos, node.from);
        const group: Group = { children: [] };
        stack[stack.length - 1].children.push(group);
        stack.push(group);
        pos = node.from + 1;
      }
    },
    leave: (node) => {
      if (node.name === 'FunctionCallBody' || node.name === 'ParenExpr') {
        pushText(pos, node.to - 1);
        stack.pop();
        pos = node.to;
      }
    },
  });
  pushText(pos, expr.length);
  return root.children;
};

const flatten = (nodes: Node[]): string =>
  nodes
    .map((node) => {
      if (typeof node === 'string') {
        return node;
      }
      return isGroup(node) ? `(${flatten(node.children)})` : node.op;
    })
    .join('');

/**
 * Splits a text node on commas that are not inside quoted strings, label
 * matchers, range selectors or grouping labels (e.g. `by (...)`).
 */
const splitTopLevel = (text: string): string[] => {
  const pieces: string[] = [];
  let piece = '';
  let depth = 0;
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      piece += char;
      i++;
      while (i < text.length) {
        piece += text[i];
        if (text[i] === '\\' && i + 1 < text.length) {
          piece += text[i + 1];
          i += 2;
          continue;
        }
        if (text[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (char === '{' || char === '[' || char === '(') {
      depth++;
    } else if (char === '}' || char === ']' || char === ')') {
      depth--;
    } else if (char === ',' && depth === 0) {
      pieces.push(piece);
      piece = '';
      i++;
      continue;
    }
    piece += char;
    i++;
  }
  pieces.push(piece);
  return pieces;
};

/** Splits a group's children into parts separated by top-level commas. */
const splitByCommas = (nodes: Node[]): Node[][] => {
  const parts: Node[][] = [[]];
  for (const node of nodes) {
    if (typeof node !== 'string' || !node.includes(',')) {
      parts[parts.length - 1].push(node);
      continue;
    }
    const pieces = splitTopLevel(node);
    pieces.forEach((piece, index) => {
      if (index > 0) {
        parts.push([]);
      }
      if (piece.length > 0) {
        parts[parts.length - 1].push(piece);
      }
    });
  }
  return parts;
};

const trimPart = (nodes: Node[]): Node[] => {
  const trimmed = [...nodes];
  if (typeof trimmed[0] === 'string') {
    trimmed[0] = trimmed[0].trimStart();
    if (trimmed[0] === '') {
      trimmed.shift();
    }
  }
  const last = trimmed.length - 1;
  if (typeof trimmed[last] === 'string') {
    trimmed[last] = (trimmed[last] as string).trimEnd();
    if (trimmed[last] === '') {
      trimmed.pop();
    }
  }
  return trimmed;
};

const renderSequence = (nodes: Node[], level: number, indent: number, maxWidth: number): string => {
  const pad = ' '.repeat(level * indent);
  const flat = flatten(nodes);
  if (level * indent + flat.length <= maxWidth) {
    return flat;
  }

  // Break at binary operators first: each operand goes on its own line with
  // the operator (and modifiers) leading the next line.
  if (nodes.some(isBreak)) {
    const segments: Node[][] = [[]];
    const operators: string[] = [];
    for (const node of nodes) {
      if (isBreak(node)) {
        operators.push(node.op.trim());
        segments.push([]);
      } else {
        segments[segments.length - 1].push(node);
      }
    }
    return segments
      .map((segment, index) => {
        const part = trimPart(index === 0 ? segment : [`${operators[index - 1]} `, ...segment]);
        return (index === 0 ? '' : pad) + renderSequence(part, level, indent, maxWidth);
      })
      .join('\n');
  }

  let out = '';
  let column = level * indent;
  for (const node of nodes) {
    if (typeof node === 'string') {
      out += node;
      column += node.length;
      continue;
    }
    if (!isGroup(node)) {
      continue; // unreachable: breaks are handled above
    }
    if (node.children.length === 0) {
      out += '()';
      column += 2;
      continue;
    }
    const flatGroup = `(${flatten(node.children)})`;
    if (column + flatGroup.length <= maxWidth) {
      out += flatGroup;
      column += flatGroup.length;
      continue;
    }
    out += `(\n${renderGroupContent(node.children, level + 1, indent, maxWidth)}\n${pad})`;
    column = level * indent + 1;
  }
  return out;
};

const renderGroupContent = (nodes: Node[], level: number, indent: number, maxWidth: number): string => {
  const pad = ' '.repeat(level * indent);
  const parts = splitByCommas(nodes)
    .map(trimPart)
    .filter((part) => part.length > 0);
  return parts.map((part) => pad + renderSequence(part, level, indent, maxWidth)).join(',\n');
};

/**
 * Pretty-prints a PromQL expression by breaking parenthesized groups and
 * binary operations that exceed the maximum line width onto indented lines.
 * Expressions that fit on a single line are returned unchanged.
 *
 * The expression is parsed with `@prometheus-io/lezer-promql`. Grafana
 * template variables (e.g. `$__rate_interval`, `${cluster}`) are supported
 * even though they are not valid PromQL. Throws if the expression cannot be
 * parsed or if the options are invalid.
 *
 * ```ts
 * prettify({ expr: promql.sum({ expr: '...', by: ['cluster'] }) });
 * ```
 */
export const prettify = ({ expr, indent = 2, maxWidth = 80 }: PrettifyOptions): string => {
  if (!Number.isInteger(indent) || indent < 0) {
    throw new Error(`indent must be a non-negative integer, got: ${indent}`);
  }
  if (!Number.isInteger(maxWidth) || maxWidth < 1) {
    throw new Error(`maxWidth must be a positive integer, got: ${maxWidth}`);
  }
  const { masked, substitutions } = maskTemplateVariables(expr);
  const rendered = renderSequence(parseExpression(masked), 0, indent, maxWidth);
  return restoreTemplateVariables(rendered, substitutions);
};
