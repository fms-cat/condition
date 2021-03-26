import { RANDOM_RESOLUTION, STATIC_RANDOM_RESOLUTION } from '../config';
import { RandomTexture } from '../utils/RandomTexture';
import { glCat } from './canvas';

export const randomTexture = new RandomTexture(
  glCat,
  RANDOM_RESOLUTION[ 0 ],
  RANDOM_RESOLUTION[ 1 ]
);
randomTexture.update();

export const randomTextureStatic = new RandomTexture(
  glCat,
  STATIC_RANDOM_RESOLUTION[ 0 ],
  STATIC_RANDOM_RESOLUTION[ 1 ]
);
randomTextureStatic.update();
