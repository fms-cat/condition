import { sine } from './sine';
import { repeat } from './repeat';
import { hermitePatch } from './hermitePatch';
import { transpose } from './transpose';

// quotes! prevent fx names from being mangled
const fxDefinitions = {
  'sine': sine,
  'repeat': repeat,
  'hermitePatch': hermitePatch,
  'transpose': transpose,
};

export { fxDefinitions };
