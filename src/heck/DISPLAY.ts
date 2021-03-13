import { RESOLUTION } from '../config';
import { GLCat } from '@fms-cat/glcat-ts';

const canvas = document.createElement( 'canvas' );
canvas.width = RESOLUTION[ 0 ];
canvas.height = RESOLUTION[ 1 ];

const gl = canvas.getContext( 'webgl2' )!;
gl.lineWidth( 1 );

const glCat = new GLCat( gl );

export const DISPLAY = {
  canvas,
  gl,
  glCat
};
