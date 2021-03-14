import { RESOLUTION } from '../config';
import { GLCat } from '@fms-cat/glcat-ts';

export const canvas = document.createElement( 'canvas' );
canvas.width = RESOLUTION[ 0 ];
canvas.height = RESOLUTION[ 1 ];

export const gl = canvas.getContext( 'webgl2' )!;
gl.lineWidth( 1 );

export const glCat = new GLCat( gl );
