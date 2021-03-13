#version 300 es

const float MODE_RECT = 0.0;
const float MODE_GRID = 1.0;
const float MODE_CIRCLE = 2.0;
const float MODES = 3.0;
const float HUGE = 9E16;
const float PI = 3.14159265;
const float TAU = 6.283185307;

#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i+0.5)/(m))*(m))

// -------------------------------------------------------------------------------------------------

in vec2 computeUV;
in vec2 position;

out float vLife;
out float vMode;
out vec2 vUv;
out vec3 vNormal;
out vec4 vPosition;

uniform vec2 resolution;
uniform vec2 resolutionCompute;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;
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
  vec4 dice = random( computeUV.xy * 182.92 );
  vMode = floor( float( MODES ) * dice.w );

  vUv = 0.5 + 0.5 * position;

  vNormal = normalize( ( normalMatrix * vec4( 0.0, 0.0, 1.0, 1.0 ) ).xyz );

  vLife = tex0.w;

  // == compute size ===============================================================================
  vPosition = vec4( tex0.xyz, 1.0 );

  vec2 size;

  if ( vMode == MODE_RECT ) {
    size = 1.0 * dice.xy;

  } else if ( vMode == MODE_GRID ) {
    size = vec2( 0.25 + 0.25 * dice.x );

  } else if ( vMode == MODE_CIRCLE ) {
    size = vec2( 1.0 * dice.x );

  }

  vec2 shape = position * size;

  vPosition.xy += shape;

  // == send the vertex position ===================================================================
  vPosition = modelMatrix * vPosition;
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
