export interface PrettifyOptions {
  /** The expression to pretty-print. */
  expr: string;
  /** Number of spaces per indentation level. Defaults to 2. */
  indent?: number;
  /** Maximum line width before a parenthesized group is broken onto multiple lines. Defaults to 80. */
  maxWidth?: number;
}

type Node = string | Group;

interface Group {
  children: Node[];
}

/**
 * Parses an expression into a tree of text and parenthesized groups.
 * Quoted strings are treated as opaque text so parentheses and commas
 * inside label values (e.g. regex matchers) are never interpreted.
 */
const parse = (expr: string): Node[] => {
  const root: Group = { children: [] };
  const stack: Group[] = [root];
  let text = '';

  const flushText = () => {
    if (text.length > 0) {
      stack[stack.length - 1].children.push(text);
      text = '';
    }
  };

  let i = 0;
  while (i < expr.length) {
    const char = expr[i];

    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      text += char;
      i++;
      while (i < expr.length) {
        text += expr[i];
        if (expr[i] === '\\' && i + 1 < expr.length) {
          text += expr[i + 1];
          i += 2;
          continue;
        }
        if (expr[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // Label matchers ({...}) and range selectors ([...]) are kept as opaque
    // text so the commas and colons inside them are never treated as
    // top-level argument separators.
    if (char === '{' || char === '[') {
      const close = char === '{' ? '}' : ']';
      let depth = 0;
      while (i < expr.length) {
        const inner = expr[i];
        if (inner === '"' || inner === "'" || inner === '`') {
          const quote = inner;
          text += inner;
          i++;
          while (i < expr.length) {
            text += expr[i];
            if (expr[i] === '\\' && i + 1 < expr.length) {
              text += expr[i + 1];
              i += 2;
              continue;
            }
            if (expr[i] === quote) {
              i++;
              break;
            }
            i++;
          }
          continue;
        }
        text += inner;
        if (inner === char) {
          depth++;
        } else if (inner === close) {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        i++;
      }
      continue;
    }

    if (char === '(') {
      flushText();
      const group: Group = { children: [] };
      stack[stack.length - 1].children.push(group);
      stack.push(group);
    } else if (char === ')') {
      if (stack.length === 1) {
        throw new Error(`Unbalanced parentheses in expression: ${expr}`);
      }
      flushText();
      stack.pop();
    } else {
      text += char;
    }
    i++;
  }

  if (stack.length > 1) {
    throw new Error(`Unbalanced parentheses in expression: ${expr}`);
  }
  flushText();
  return root.children;
};

const flatten = (nodes: Node[]): string =>
  nodes.map((node) => (typeof node === 'string' ? node : `(${flatten(node.children)})`)).join('');

/**
 * Splits a text node on commas that are not inside quoted strings, label
 * matchers or range selectors.
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
    if (char === '{' || char === '[') {
      depth++;
    } else if (char === '}' || char === ']') {
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

  let out = '';
  let column = level * indent;
  for (const node of nodes) {
    if (typeof node === 'string') {
      out += node;
      column += node.length;
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
 * Pretty-prints a PromQL expression by breaking parenthesized groups that
 * exceed the maximum line width onto indented lines. Expressions that fit
 * on a single line are returned unchanged.
 *
 * ```ts
 * prettify({ expr: promql.sum({ expr: '...', by: ['cluster'] }) });
 * ```
 */
export const prettify = ({ expr, indent = 2, maxWidth = 80 }: PrettifyOptions): string => {
  return renderSequence(parse(expr), 0, indent, maxWidth);
};
