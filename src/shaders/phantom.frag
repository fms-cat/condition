#version 300 es

precision highp float;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

const int MARCH_ITER = 20;
const float INV_MARCH_ITER = 1.0 / float( MARCH_ITER );
const float PI = 3.14159265;
const float TAU = PI * 2.0;

out vec4 fragColor;

uniform float frameCount;
uniform float time;
uniform vec2 resolution;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 inversePVM;
uniform sampler2D samplerDeferred0;
uniform sampler2D samplerRandom;
uniform sampler2D samplerShadow;

float cameraDepth;

#pragma glslify: prng = require( ./-prng );
#pragma glslify: orthBasis = require( ./modules/orthBasis );

mat2 r2d( float t ) {
  return mat2( cos( t ), sin( t ), -sin( t ), cos( t ) );
}

vec3 cyclicNoise( vec3 p, vec3 b ) {
  vec3 sum = vec3( 0.0 );
  float amp = 0.5;
  float warp = 1.3;
  mat3 rot = orthBasis( b );

  for ( int i = 0; i < 8; i ++ ) {
    p *= rot * 2.0;
    p += sin( p.zxy * warp );
    sum += sin( cross( cos( p ), sin( p.yzx ) ) ) * amp;
    amp *= 0.5;
    warp *= 1.3;
  }

  return sum;
}

vec3 divideByW( vec4 v ) {
  return v.xyz / v.w;
}

float map( vec3 p ) {
  p.zx = r2d( 0.2 * p.y ) * p.zx;
  vec3 b = vec3( sin( 0.3 * time ), 0.2, cos( 0.3 * time ) );
  float d = cyclicNoise( 0.1 * p, b ).x;
  // d += max( d, 5.0 - length( p ) );
  return d;
}

void main() {
  vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.y;
  vec4 seed = texture( samplerRandom, p );
  prng( seed );

  vec4 texDeferred0 = texture( samplerDeferred0, gl_FragCoord.xy / resolution.xy );
  cameraDepth = 2.0 * texDeferred0.w - 1.0;

  vec3 rayOri = divideByW( inversePVM * vec4( p, 0.0, 1.0 ) );
  vec3 farPos = divideByW( inversePVM * vec4( p, 1.0, 1.0 ) );
  vec3 rayDir = normalize( farPos - rayOri );
  float rayLen = 1E-2;
  vec3 rayPos = rayOri + rayDir * rayLen;

  float accum = 0.0;
  float isect;

  for ( int i = 0; i < MARCH_ITER; i ++ ) {
    isect = map( rayPos );
    accum += exp( -10.0 * abs( isect ) ) * INV_MARCH_ITER;
    rayLen += max( prng( seed ) * 0.1, abs( isect ) );
    rayPos = rayOri + rayDir * rayLen;

    // kill me
    vec4 pt = projectionMatrix * viewMatrix * vec4( rayPos, 1.0 );
    float depth = pt.z / pt.w;
    if ( depth > cameraDepth ) {
      break;
    }
  }

  float flicker = step( 0.5, fract( 30.0 * time ) );
  vec3 col = 0.3 + 0.3 * sin( 3.5 + 1.0 * accum + vec3( 0.0, 2.0, 4.0 ) );
  col *= ( 0.5 + 0.1 * flicker ) * accum;

  fragColor = vec4( col, 1.0 );
}
