#version 300 es

const int MODE_RECT = 0;
const int MODE_GRID = 1;
const int MODE_CIRCLE = 2;
const int MODE_CHAR = 3;
const int MODE_BUTTON = 4;
const int MODE_ICON = 5;
const int MODES = 6;

const float HUGE = 9E16;
const float PI = 3.14159265;
const float TAU = 6.283185307;

#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i+0.5)/(m))*(m))

// -------------------------------------------------------------------------------------------------

in vec2 computeUV;
in vec3 position;
in vec3 normal;

out float vLife;
out vec2 vUv;
out vec3 vNormal;
out vec4 vPosition;
out vec4 vColor;
out vec4 vDice;

uniform bool isShadow;
uniform float ppp;
uniform float trailShaker;
uniform float colorVar;
uniform float colorOffset;
uniform vec2 resolution;
uniform vec2 resolutionCompute;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;
uniform sampler2D samplerCompute0;
uniform sampler2D samplerCompute1;
uniform sampler2D samplerRandomStatic;

// -------------------------------------------------------------------------------------------------

vec3 catColor( float _p ) {
  return 0.5 + 0.5 * vec3(
    cos( _p ),
    cos( _p + PI / 3.0 * 4.0 ),
    cos( _p + PI / 3.0 * 2.0 )
  );
}

vec4 random( vec2 _uv ) {
  return texture( samplerRandomStatic, _uv );
}

mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

// -------------------------------------------------------------------------------------------------

void main() {
  // == fetch texture ==============================================================================
  vec4 tex0 = texture( samplerCompute0, computeUV );
  vec4 tex1 = texture( samplerCompute1, computeUV );

  // == assign varying variables ===================================================================
  vDice = random( computeUV.xy * 182.92 );

  vColor.xyz = vec3( 0.8 );

  vLife = tex0.w;

  // == compute size ===============================================================================
  vPosition = vec4( tex0.xyz, 1.0 );

  float size = vDice.x * 0.05;
  size *= sin( PI * saturate( vLife ) );

  vec3 shape = position * size;
  shape.yz = rotate2D( 7.0 * ( vPosition.x + vDice.z ) ) * shape.yz;
  shape.zx = rotate2D( 7.0 * ( vPosition.y + vDice.w ) ) * shape.zx;

  vPosition.xyz += shape;

  // == compute normals ============================================================================
  vNormal = ( normalMatrix * vec4( normal, 1.0 ) ).xyz;
  vNormal.yz = rotate2D( 7.0 * ( vPosition.x + vDice.z ) ) * vNormal.yz;
  vNormal.zx = rotate2D( 7.0 * ( vPosition.y + vDice.w ) ) * vNormal.zx;

  // == send the vertex position ===================================================================
  vPosition = modelMatrix * vPosition;
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
