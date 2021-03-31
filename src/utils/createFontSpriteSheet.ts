// yoinked from https://github.com/mapbox/tiny-sdf (BSD 2-Clause)

import { GLCatTexture } from '@fms-cat/glcat-ts';
import { glCat } from '../globals/canvas';

const SPRITE_SIZE = 128;
export const SPRITE_SHEET_SIZE = 16 * SPRITE_SIZE;

const CHARS = [ ...new Array( 256 ).keys() ].map( ( i ) => String.fromCharCode( i ) );

export function createFontSpriteSheet( { font, baseline }: {
  font: string;

  /**
   * 0.8 is recommended
   */
  baseline?: number;
} ): GLCatTexture {
  const texture = glCat.createTexture();

  const canvas = document.createElement( 'canvas' );
  canvas.width = SPRITE_SHEET_SIZE;
  canvas.height = SPRITE_SHEET_SIZE;

  const context = canvas.getContext( '2d' )!;
  context.textAlign = 'center';
  context.fillStyle = '#fff';

  context.font = font;

  for ( let i = 0; i < 256; i ++ ) {
    const char = CHARS[ i ];
    const x = ( ( i % 16 ) + 0.5 ) * SPRITE_SIZE;
    const y = ( Math.floor( i / 16 ) + ( baseline ?? 0.7 ) ) * SPRITE_SIZE;

    context.fillText( char, x, y );
  }

  texture.setTexture( canvas );

  return texture;
}
