/**
 * @file data/masterdb-schema.js
 * @description Constants for component families and schemas.
 */

export const COMPONENT_FAMILIES = {
  PIPE: 'PIPE',
  ELBOW: 'ELBOW',
  BEND: 'BEND',
  TEE: 'TEE',
  OLET: 'OLET',
  BRANCH: 'BRANCH',
  REDUCER: 'REDUCER',
  FLANGE: 'FLANGE',
  VALVE: 'VALVE',
  SUPPORT: 'SUPPORT',
  SPECIALTY: 'SPECIALTY',
  MISC: 'MISC'
};

export const VISIBLE_SCHEMA = [
  'Component',
  'Size',
  'Length',
  'Weight'
];

export const VISIBLE_OPTIONAL_COLUMNS = [
  'Subtype',
  'Rating',
  'Schedule',
  'Facing',
  'EndType',
  'BranchSize',
  'Standard'
];
