import { hermitePatch } from './hermitePatch';
import { repeat } from './repeat';
import { sine } from './sine';
import { transpose } from './transpose';

// quotes! prevent fx names from being mangled
const fxDefinitions = {
  'sine': sine,
  'repeat': repeat,
  'hermitePatch': hermitePatch,
  'transpose': transpose,
};

export { fxDefinitions };
