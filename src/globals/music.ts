import { Music } from '../Music';
import { glCat } from './canvas';

export const audio = new AudioContext();
export const music = new Music( glCat, audio );
