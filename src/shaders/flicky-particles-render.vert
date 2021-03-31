#version 300 es

const int MODE_RECT = 0;
const int MODE_GRID = 1;
const int MODE_CIRCLE = 2;
const int MODE_SLASHER = 3;
const int MODE_TAMBO = 4;
const int MODE_C = 5;
const int MODE_THEREFORE = 6;
const int MODE_SPEEN = 7;
const int MODES = 8;
const float HUGE = 9E16;
const float PI = 3.14159265;
const float TAU = 6.283185307;

#define fs(i) (fract(sin((i)*114.514)*1919.810))
#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i+0.5)/(m))*(m))

// -------------------------------------------------------------------------------------------------

layout (location = 0) in vec2 position;
layout (location = 1) in vec2 computeUV;

out float vLife;
out float vMode;
out vec2 vUv;
out vec2 vSize;
out vec4 vPosition;
out vec4 vDice;

uniform vec2 resolution;
uniform vec2 resolutionCompute;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform sampler2D samplerCompute0;
uniform sampler2D samplerRandomStatic;

// == utils ========================================================================================
vec4 random( vec2 uv ) {
  return texture( samplerRandomStatic, uv );
}

mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

// == main procedure ===============================================================================
void main() {
  vec4 tex0 = texture( samplerCompute0, computeUV );

  // == assign varying variables ===================================================================
  vDice = fs( random( computeUV.xy * 88.92 + 0.42 ) ); // precision matters,,,?

  vec4 dice = fs( random( computeUV.xy * 182.92 ) );
  int mode = int( float( MODES ) * dice.w );
  vMode = float( mode );

  vUv = 0.5 + 0.5 * position;

  vLife = tex0.w;

  // == compute size ===============================================================================
  vPosition = vec4( tex0.xyz, 1.0 );

  if ( mode == MODE_RECT ) {
    vSize = 1.0 * dice.xy;

  } else if ( mode == MODE_GRID ) {
    vSize = vec2( 0.25 );

  } else if ( mode == MODE_CIRCLE ) {
    vSize = vec2( 3.0 * dice.x * dice.x );

  } else if ( mode == MODE_SLASHER ) {
    vSize = vec2( 0.6, 0.2 ) * dice.xy;

  } else if ( mode == MODE_TAMBO || mode == MODE_C || mode == MODE_THEREFORE || mode == MODE_SPEEN ) {
    vSize = vec2( 0.2 * dice.x );

  }

  vec2 shape = position * vSize;

  vPosition.xy += shape;

  // == send the vertex position ===================================================================
  vPosition = modelMatrix * vPosition;
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
