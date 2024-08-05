import { OffsetUnits } from './types';

export const buildOffsetString = (offset: OffsetUnits) => {
  if (Object.keys(offset).length === 0) {
    // Default to minimum allowed offset
    return '1m';
  }
  // iterate through all units and build a string from them
  let unitString = '';
  for (const [unit, value] of Object.entries(offset)) {
    if (value !== 0) {
      unitString += `${value}${unit}`;
    }
  }
  return unitString;
};
