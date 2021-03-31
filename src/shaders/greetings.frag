#version 300 es

precision highp float;

in float vTime;
in vec2 vUv;
in vec4 vCharParams;

out vec4 fragColor;

uniform sampler2D samplerSpriteSheets[ 8 ];


// this is BAD
vec4 fetchSpriteSheet( int iFont ) {
  if ( iFont == 0 ) {
    return texture( samplerSpriteSheets[ 0 ], vUv );
  } else if ( iFont == 1 ) {
    return texture( samplerSpriteSheets[ 1 ], vUv );
  } else if ( iFont == 2 ) {
    return texture( samplerSpriteSheets[ 2 ], vUv );
  } else if ( iFont == 3 ) {
    return texture( samplerSpriteSheets[ 3 ], vUv );
  } else if ( iFont == 4 ) {
    return texture( samplerSpriteSheets[ 4 ], vUv );
  } else if ( iFont == 5 ) {
    return texture( samplerSpriteSheets[ 5 ], vUv );
  } else if ( iFont == 6 ) {
    return texture( samplerSpriteSheets[ 6 ], vUv );
  } else if ( iFont == 7 ) {
    return texture( samplerSpriteSheets[ 7 ], vUv );
  }
}

// gl.ONE, gl.ONE
void main() {
  if ( vTime < 0.0 ) { discard; }

  int font = int( vCharParams.z ) % 8;
  fragColor = exp( -17.0 * vTime ) * fetchSpriteSheet( font ) * vec4( 3.0, 0.4, 7.0, 1.0 );
}
