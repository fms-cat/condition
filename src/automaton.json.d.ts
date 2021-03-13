import type { SerializedAutomatonWithGUI } from '@fms-cat/automaton-with-gui';

declare module './automaton.json' {
  const data: SerializedAutomatonWithGUI;
  export default data;
}
