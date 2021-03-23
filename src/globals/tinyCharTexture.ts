import { gl, glCat } from './canvas';
import char5x5Png from '../images/char5x5.png';

export const tinyCharTexture = glCat.createTexture();

const image = new Image();
image.onload = () => {
  tinyCharTexture.setTexture( image );
  tinyCharTexture.textureFilter( gl.NEAREST );
};
image.src = char5x5Png;
