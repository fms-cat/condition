import { Automaton } from '@fms-cat/automaton';
import { AutomatonWithGUI } from '@fms-cat/automaton-with-gui';
import { fxDefinitions } from '../automaton-fxs/fxDefinitions';
import { getDivAutomaton } from './dom';
import { music } from './music';
import automatonData from '../automaton.json';

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

    automatonWithGUI.on( 'play', () => { music.isPlaying = true; } );
    automatonWithGUI.on( 'pause', () => { music.isPlaying = false; } );
    automatonWithGUI.on( 'seek', ( { time } ) => {
      music.time = Math.max( 0.0, time );
      automatonWithGUI.reset();
    } );

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

export const auto = automaton.auto;
