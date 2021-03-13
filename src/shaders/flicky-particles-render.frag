#version 300 es

precision highp float;

const int MTL_UNLIT = 1;

const int MODE_RECT = 0;
const int MODE_GRID = 1;
const int MODE_CIRCLE = 2;
const int MODES = 3;
const float PI = 3.14159265;
const float TAU = 6.28318531;

#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

// == varings / uniforms ===========================================================================
in vec4 vPosition;
in vec3 vNormal;
in float vLife;
in vec2 vUv;
in float vMode;

layout (location = 0) out vec4 fragPosition;
layout (location = 1) out vec4 fragNormal;
layout (location = 2) out vec4 fragColor;
layout (location = 3) out vec4 fragWTF;

uniform float time;

// == utils ========================================================================================
vec2 yflip( vec2 uv ) {
  return vec2( 0.0, 1.0 ) + vec2( 1.0, -1.0 ) * uv;
}

// == main procedure ===============================================================================
void main() {
  int mode = int( vMode + 0.5 );

  vec3 color = vec3( 0.0 );

  if ( vLife < 0.0 ) { discard; }
  if ( vLife < 0.1 && 0.5 < fract( 30.0 * vLife ) ) { discard; }

  if ( mode == MODE_RECT ) {
    vec2 size = vec2( 0.5 );
    size.y *= 1.0 - exp( -10.0 * ( 1.0 - vLife ) );

    vec2 uv = vUv;
    vec2 deltaUv = abs( vec2( dFdx( uv.x ), dFdy( uv.y ) ) );
    vec2 folded = ( size - abs( uv - 0.5 ) ) / deltaUv;
    bool isVert = false;

    if ( folded.x < folded.y ) {
      uv.xy = vec2( uv.y, uv.x );
      folded.xy = folded.yx;
      deltaUv.xy = deltaUv.yx;
      isVert = true;
    }

    float spinUvx = uv.y < 0.5 ? uv.x : ( 1.0 - uv.x );
    spinUvx = isVert ? ( 1.0 - spinUvx ) : spinUvx;

    float border = step( 0.0, folded.y ) * step( folded.y, 2.0 );
    border *= step( 0.0, sin( 12.0 * time + 0.5 * spinUvx / deltaUv.x ) ); // dashed

    if ( border < 0.5 ) { discard; }

    color = vec3( 1.0 );

  } else if ( mode == MODE_GRID ) {
    float size = 0.2;
    size *= 1.0 - exp( -10.0 * ( 1.0 - vLife ) );

    vec2 uv = vUv;

    vec2 folded = mod( 4.0 * uv, 1.0 );

    float shape = step( length( folded - 0.5 ), size );

    if ( shape < 0.5 ) { discard; }

    color = vec3( 1.0 );

  } else if ( mode == MODE_CIRCLE ) {
    float size = 0.5;
    size *= 1.0 - exp( -10.0 * ( 1.0 - vLife ) );

    vec2 uv = vUv;
    vec2 deltaUv = abs( vec2( dFdx( uv.x ), dFdy( uv.y ) ) );

    float r = length( uv - 0.5 );
    float shape = step( r, size );
    shape *= step( size, r + length( deltaUv ) );

    if ( shape < 0.5 ) { discard; }

    color = vec3( 1.0 );

  }

  fragPosition = vPosition;
  fragNormal = vec4( vNormal, 1.0 );
  fragColor = vec4( color, 1.0 );
  fragWTF = vec4( vec3( 0.0 ), MTL_UNLIT );
}
