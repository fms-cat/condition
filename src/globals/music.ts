import { Music } from '../Music';
import { automatonSetupMusic } from './automaton';
import { glCat } from './canvas';

export const audio = new AudioContext();
export const music = new Music( glCat, audio );
automatonSetupMusic( music );
