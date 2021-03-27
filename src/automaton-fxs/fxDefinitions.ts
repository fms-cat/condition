import { gravity } from './gravity';
import { hermitePatch } from './hermitePatch';
import { repeat } from './repeat';
import { sine } from './sine';
import { transpose } from './transpose';

// quotes! prevent fx names from being mangled
const fxDefinitions = {
  'gravity': gravity,
  'hermitePatch': hermitePatch,
  'repeat': repeat,
  'sine': sine,
  'transpose': transpose,
};

export { fxDefinitions };
