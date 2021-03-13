#version 300 es

precision highp float;

const float PARTICLE_LIFE_LENGTH = 1.0;
const float HUGE = 9E16;
const float PI = 3.14159265;
const float TAU = 6.283185307;

#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i)/(m)+.5)*(m))

out vec4 fragCompute0;

uniform bool init;
uniform float time;
uniform float beat;
uniform float particlesSqrt;
uniform float totalFrame;
uniform float deltaTime;
uniform float noiseScale;
uniform float noisePhase;
uniform vec2 resolution;
uniform sampler2D samplerCompute0;
uniform sampler2D samplerRandom;

vec4 sampleRandom( vec2 _uv ) {
  return texture( samplerRandom, _uv );
}

#pragma glslify: prng = require( ./-prng );

vec3 randomSphere( inout vec4 seed ) {
  vec3 v;
  for ( int i = 0; i < 10; i ++ ) {
    v = vec3(
      prng( seed ),
      prng( seed ),
      prng( seed )
    ) * 2.0 - 1.0;
    if ( length( v ) < 1.0 ) { break; }
  }
  return v;
}

vec2 randomCircle( inout vec4 seed ) {
  vec2 v;
  for ( int i = 0; i < 10; i ++ ) {
    v = vec2(
      prng( seed ),
      prng( seed )
    ) * 2.0 - 1.0;
    if ( length( v ) < 1.0 ) { break; }
  }
  return v;
}

vec3 randomBox( inout vec4 seed ) {
  vec3 v;
  v = vec3(
    prng( seed ),
    prng( seed ),
    prng( seed )
  ) * 2.0 - 1.0;
  return v;
}

// ------

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;

  float dt = deltaTime;

  // == prepare some vars ==========================================================================
  vec4 seed = texture( samplerRandom, uv );
  prng( seed );

  vec4 tex0 = texture( samplerCompute0, uv );

  vec3 pos = tex0.xyz;
  float life = tex0.w;

  float timing = mix(
    0.0,
    PARTICLE_LIFE_LENGTH,
    ( floor( uv.x * particlesSqrt ) / particlesSqrt + floor( uv.y * particlesSqrt ) ) / particlesSqrt
  );
  timing += lofi( time, PARTICLE_LIFE_LENGTH );

  if ( time - deltaTime + PARTICLE_LIFE_LENGTH < timing ) {
    timing -= PARTICLE_LIFE_LENGTH;
  }

  // == initialize particles =======================================================================
  if (
    time - deltaTime < timing && timing <= time
  ) {
    dt = time - timing;

    pos = 3.0 * randomSphere( seed );

    life = 1.0;
  } else {
    // do nothing
    // if you want to remove init frag from the particle, do at here
  }

  // == update particles ===========================================================================
  life -= dt / PARTICLE_LIFE_LENGTH;

  fragCompute0 = vec4( pos, life );
}
