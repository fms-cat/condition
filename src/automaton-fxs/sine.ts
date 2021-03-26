import type { FxDefinition } from '@fms-cat/automaton';

const TAU = Math.PI * 2.0;

export const sine: FxDefinition = {
  func( context ) {
    const v = context.value;
    const p = context.elapsed * context.params.freq + context.params.offset;
    return v + context.params.amp * Math.sin( p * TAU );
  }
};

if ( process.env.DEV ) {
  sine.name = 'Sinewave';
  sine.description = 'Overlay a sinewave to the curve.';
  sine.params = {
    amp: { name: 'Amp', type: 'float', default: 0.1 },
    freq: { name: 'Frequency', type: 'float', default: 5.0 },
    offset: { name: 'Offset', type: 'float', default: 0.0, min: 0.0, max: 1.0 }
  };
}
