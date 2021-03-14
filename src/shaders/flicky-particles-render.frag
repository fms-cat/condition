#version 300 es

precision highp float;

const int MTL_UNLIT = 1;

const int MODE_RECT = 0;
const int MODE_GRID = 1;
const int MODE_CIRCLE = 2;
const int MODE_SLASHER = 3;
const int MODE_TAMBO = 4;
const int MODE_C = 5;
const int MODE_THEREFORE = 6;
const int MODE_SPEEN = 7;
const int MODES = 8;
const float PI = 3.14159265;
const float TAU = 6.28318531;

#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))

// == varings / uniforms ===========================================================================
in float vLife;
in float vMode;
in vec2 vUv;
in vec2 vSize;
in vec3 vNormal;
in vec4 vPosition;
in vec4 vDice;

layout (location = 0) out vec4 fragPosition;
layout (location = 1) out vec4 fragNormal;
layout (location = 2) out vec4 fragColor;
layout (location = 3) out vec4 fragWTF;

uniform float time;
uniform sampler2D samplerRandomStatic;

// == utils ========================================================================================
mat2 rotate2D( float t ) {
  return mat2( cos( t ), sin( t ), -sin( t ), cos( t ) );
}

vec4 random( vec2 uv ) {
  return texture( samplerRandomStatic, uv );
}

vec2 yflip( vec2 uv ) {
  return vec2( 0.0, 1.0 ) + vec2( 1.0, -1.0 ) * uv;
}

// == main procedure ===============================================================================
void main() {
  if ( vLife < 0.0 ) { discard; }
  if ( vLife < 0.1 && 0.5 < fract( 30.0 * vLife ) ) { discard; }

  int mode = int( vMode + 0.5 );

  vec2 uv = vUv;
  vec2 deltaUv = abs( vec2( dFdx( uv.x ), dFdy( uv.y ) ) );
  vec2 p = ( uv * 2.0 - 1.0 ) * vSize;

  vec3 color = vec3( 0.0 );

  if ( mode == MODE_RECT ) {
    vec2 deltaUv = abs( vec2( dFdx( uv.x ), dFdy( uv.y ) ) );
    vec2 folded = ( vec2( 0.5 ) - abs( uv - 0.5 ) ) / deltaUv;
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
    vec2 folded = mod( 8.0 * uv, 1.0 );

    float shape = step( length( folded - 0.5 ), 0.1 );

    if ( shape < 0.5 ) { discard; }

    color = vec3( 1.0 );

  } else if ( mode == MODE_CIRCLE ) {
    float r = length( uv - 0.5 );
    float shape = step( r, 0.5 );
    shape *= step( 0.5, r + length( deltaUv ) );

    if ( shape < 0.5 ) { discard; }

    color = vec3( 1.0 );

  } else if ( mode == MODE_SLASHER ) {
    float shape = step( 0.0, sin( 40.0 * ( p.x + p.y + 0.3 * time ) ) );

    if ( shape < 0.5 ) { discard; }

    color = vec3( 1.0 );

  } else if ( mode == MODE_TAMBO ) { // 田
    if ( vLife < 0.7 ) { discard; }

    if ( any( lessThan( abs( uv - 0.5 ), vec2( 0.1 ) ) ) ) { discard; }

    float ptn = mod( floor( 4.0 * vDice.x + 30.0 * time ), 4.0 );
    float pos = floor( 2.0 * uv.x ) + 2.0 * floor( 2.0 * uv.y );
    if ( ptn != pos ) { discard; }

    color = vec3( 1.0 );

  } else if ( mode == MODE_C ) { // c
    if ( vLife < 0.7 ) { discard; }

    vec2 p = 2.0 * vUv - 1.0;
    if ( 0.2 < abs( length( p ) - 0.8 ) ) { discard; }

    float ptn = floor( mod( 8.0 * vDice.x - 30.0 * time, 8.0 ) );
    vec2 pp = rotate2D( ptn * TAU / 8.0 ) * p;
    float th = atan( pp.y, pp.x );
    if ( th < 0.0 ) { discard; }

    color = vec3( 1.0 );

  } else if ( mode == MODE_THEREFORE ) { // ∴
    if ( vLife < 0.7 ) { discard; }

    vec2 p = uv * 2.0 - 1.0;
    float ptn = floor( mod( 3.0 * vDice.x + 30.0 * time, 3.0 ) );
    p = rotate2D( -PI / 2.0 + ptn * TAU / 3.0 ) * p;

    float d = lofi( atan( p.y, p.x ) + TAU / 6.0, TAU / 3.0 );
    p = rotate2D( -d ) * p;
    p -= vec2( 0.5, 0.0 );

    if ( 0.5 < length( p ) ) { discard; }
    if ( d != 0.0 && length( p ) < 0.32 ) { discard; }

    color = vec3( 1.0 );

  } else if ( mode == MODE_SPEEN ) { // |
    if ( vLife < 0.7 ) { discard; }

    vec2 p = uv * 2.0 - 1.0;
    float ptn = floor( mod( 4.0 * vDice.x + 30.0 * time, 4.0 ) );
    vec2 pp = rotate2D( ptn * TAU / 8.0 ) * p;

    if ( 0.2 < abs( pp.x ) || 0.9 < abs( pp.y ) ) { discard; }

    color = vec3( 1.0 );

  }

  fragPosition = vPosition;
  fragNormal = vec4( vNormal, 1.0 );
  fragColor = vec4( color, 1.0 );
  fragWTF = vec4( vec3( 0.0 ), MTL_UNLIT );
}
