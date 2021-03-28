#version 300 es

precision highp float;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

const int MARCH_ITER = 20;
const float INV_MARCH_ITER = 1.0 / float( MARCH_ITER );
const float PI = 3.14159265;
const float TAU = PI * 2.0;

in float vFrustumZ;
in vec4 vPosition;

out vec4 fragColor;

uniform float time;
uniform vec2 lightNearFar;
uniform vec2 resolution;
uniform vec2 cameraNearFar;
uniform vec3 cameraPos;
uniform vec3 lightColor;
uniform vec3 lightPos;
uniform mat4 lightPV;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 inversePVM;
uniform sampler2D samplerDeferred0;
uniform sampler2D samplerRandom;
uniform sampler2D samplerShadow;

float cameraDepth;

#pragma glslify: prng = require( ./-prng );

vec3 divideByW( vec4 v ) {
  return v.xyz / v.w;
}

float map( vec3 p ) {
  vec4 pt = projectionMatrix * viewMatrix * vec4( p, 1.0 );
  float depth = pt.z / pt.w;
  if ( depth > cameraDepth ) {
    return 0.0;
  }

  float l = length( p - lightPos );
  float tooNear = smoothstep( 0.0, 0.1, l );

  vec4 lightProj = lightPV * vec4( p, 1.0 );
  vec3 lightP = lightProj.xyz / lightProj.w;

  if ( lightP.z < 0.0 || 1.0 < lightP.z ) {
    return 0.0;
  }

  float depth = linearstep(
    lightNearFar.x,
    lightNearFar.y,
    l
  );

  vec4 tex = texture( samplerShadow, 0.5 + 0.5 * lightP.xy );

  float variance = saturate( tex.y - tex.x * tex.x );
  float md = depth - tex.x;

  float softShadow = md < 0.0 ? 1.0 : linearstep( 0.2, 1.0, variance / ( variance + md * md ) );

  // spot
  float spot = smoothstep( 1.0, 0.5, length( lightP.xy ) );

  return tooNear * softShadow * spot * 1.0 / l / l;
}

void main() {
  vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.y;
  vec4 seed = texture( samplerRandom, p );
  prng( seed );

  vec4 texDeferred0 = texture( samplerDeferred0, gl_FragCoord.xy / resolution.xy );
  cameraDepth = 2.0 * texDeferred0.w - 1.0;

  vec3 rayOri = cameraPos;
  vec3 rayDir = normalize( vPosition.xyz - rayOri );
  float rayLen = gl_FrontFacing
    ? 1E-2
    : length( vPosition.xyz - rayOri );
  vec3 rayPos = rayOri + rayDir * rayLen;

  // this is terrible
  // There definitely are better ways to do this
  float stepLen = gl_FrontFacing
    ? 1.0
    : 0.1;

  float accum = 0.0;
  float isect;

  for ( int i = 0; i < MARCH_ITER; i ++ ) {
    isect = map( rayPos );
    accum += isect * INV_MARCH_ITER;
    rayLen += stepLen * 0.8 + 0.2 * prng( seed );
    rayPos = rayOri + rayDir * rayLen;

    if ( rayLen > cameraNearFar.y ) { break; }
  }

  fragColor = vec4( 0.01 * lightColor * accum, 1.0 );
}
