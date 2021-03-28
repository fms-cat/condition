import { Music } from '../music/Music';
import { MusicOffline } from '../music/MusicOffline';
import { MusicRealtime } from '../music/MusicRealtime';
import { automatonSetupMusic } from './automaton';

export const audio = new AudioContext();
let music: Music;

if ( process.env.DEV ) {
  // music = new MusicRealtime();
  music = new MusicOffline();
} else {
  music = new MusicOffline();
}

automatonSetupMusic( music );

export { music };
