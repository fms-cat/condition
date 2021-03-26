import type { FxDefinition } from '@fms-cat/automaton';

export const repeat: FxDefinition = {
  func( context ) {
    if ( context.index === context.i1 ) {
      context.setShouldNotInterpolate( true );
    }

    if (
      ( context.elapsed + context.deltaTime ) % context.params.interval < context.deltaTime
    ) {
      context.setShouldNotInterpolate( true );
    }

    return context.getValue( context.t0 + context.elapsed % context.params.interval );
  }
};

if ( process.env.DEV ) {
  repeat.name = 'Repeat';
  repeat.description = 'Repeat a section of the curve.';
  repeat.params = {
    interval: { name: 'Interval', type: 'float', default: 1.0, min: 0.0 },
  };
}
