#version 300 es

const float HUGE = 9E16;
const float PI = 3.14159265;
const float TAU = 6.283185307;
const float COLOR_VAR = 0.1;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i+0.5)/(m))*(m))

// -------------------------------------------------------------------------------------------------
layout (location = 0) in float computeU;
layout (location = 1) in float computeV;
layout (location = 2) in float triIndex;

out float vLife;
out vec3 vNormal;
out vec4 vPosition;
out vec4 vColor;
out vec4 vRandom;

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
vec3 blurpleGradient( float t ) {
  vec3 colorA = vec3( 0.01, 0.04, 0.2 );
  vec3 colorB = vec3( 0.02, 0.3, 0.9 );
  vec3 colorC = vec3( 0.9, 0.01, 0.6 );
  vec3 colorD = vec3( 0.5, 0.02, 0.02 );

  return mix(
    colorA,
    mix(
      colorB,
      mix(
        colorC,
        colorD,
        linearstep( 0.67, 1.0, t )
      ),
      linearstep( 0.33, 0.67, t )
    ),
    linearstep( 0.0, 0.33, t )
  );
}

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
  vec2 uv = vec2( computeU, computeV );

  // == fetch texture ==============================================================================
  vec4 pos = texture( samplerCompute0, uv );
  vec4 vel = texture( samplerCompute1, uv );
  vec4 velp = texture( samplerCompute1, uv - vec2( 1.0, 0.0 ) / resolutionCompute );

  // == assign varying variables ===================================================================
  vLife = pos.w;

  vRandom = random( uv.yy * 182.92 );

  vColor.xyz = (
    vRandom.y < 0.8
    ? pow( catColor( TAU * ( ( vRandom.x * 2.0 - 1.0 ) * COLOR_VAR + 0.0 ) ), vec3( 2.0 ) )
    : vec3( 0.4 )
  );
  // vColor.xyz = blurpleGradient( vLife );
  // vColor.xyz = catColor( 3.0 + 4.0 * vLife );

  vColor.w = ( velp.w < 0.5 && vel.w < 0.5 && 0.0 < vLife ) ? 1.0 : -1.0;

  // == compute size and direction =================================================================
  float size = 0.005;
  size *= 1.0 + pow( vRandom.w, 2.0 );
  // size *= max( 0.0, sin( PI * vLife ) );

  vec3 dir = normalize( vel.xyz );
  vec3 sid = normalize( cross( dir, vec3( 0.0, 1.0, 0.0 ) ) );
  vec3 top = normalize( cross( sid, dir ) );

  float theta = triIndex / 3.0 * TAU + vLife * 1.0;
  vec2 tri = vec2( sin( theta ), cos( theta ) );
  vNormal = ( normalMatrix * vec4( tri.x * sid + tri.y * top, 1.0 ) ).xyz;
  pos.xyz += size * vNormal;

  vPosition = modelMatrix * vec4( pos.xyz, 1.0 );
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
