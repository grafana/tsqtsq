import { OffsetUnits } from './types';

export const buildOffsetString = (offset: OffsetUnits) => {
  // iterate through all units and build a string from them
  if (Object.keys(offset).length === 0) {
    return '0m';
  }
  let unitString = '';
  for (const [unit, value] of Object.entries(offset)) {
    if (value !== 0) {
      unitString += `${value}${unit}`;
    }
  }
  return unitString;
};
