import { Automaton } from '@fms-cat/automaton';
import { AutomatonWithGUI } from '@fms-cat/automaton-with-gui';
import { fxDefinitions } from '../automaton-fxs/fxDefinitions';
import { getDivAutomaton } from './dom';
import automatonData from '../automaton.json';
import type { Music } from '../Music';

export const automaton = ( () => {
  if ( process.env.DEV ) {
    // this cast smells so bad
    // https://github.com/FMS-Cat/automaton/issues/121
    const automatonWithGUI = new AutomatonWithGUI(
      automatonData,
      {
        gui: getDivAutomaton(),
        isPlaying: true,
        fxDefinitions,
      },
    );

    if ( module.hot ) {
      module.hot.accept( '../automaton.json', () => {
        // we probably don't need this feature for now...
        // See: https://github.com/FMS-Cat/automaton/issues/120
        // automatonWithGUI.deserialize( automatonData );
      } );
    }

    return automatonWithGUI;
  } else {
    return new Automaton(
      automatonData,
      {
        fxDefinitions,
      },
    );
  }
} )();

/**
 * Since automaton and music try to reference each other...
 */
export function automatonSetupMusic( music: Music ): void {
  if ( process.env.DEV ) {
    const automatonWithGUI = automaton as AutomatonWithGUI;

    automatonWithGUI.on( 'play', () => { music.isPlaying = true; } );
    automatonWithGUI.on( 'pause', () => { music.isPlaying = false; } );
    automatonWithGUI.on( 'seek', ( { time } ) => {
      music.time = Math.max( 0.0, time );
      automatonWithGUI.reset();
    } );
  }
}

export const auto = automaton.auto;
