import { Music } from '../music/Music';
import { MusicOffline } from '../music/MusicOffline';
import { MusicRealtime } from '../music/MusicRealtime';
import { automatonSetupMusic } from './automaton';

export const audio = new AudioContext();
export const music: Music = new MusicRealtime();
// export const music: Music = new MusicOffline();
automatonSetupMusic( music );
