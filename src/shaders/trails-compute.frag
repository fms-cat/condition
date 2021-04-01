#version 300 es

precision highp float;

const float PARTICLE_LIFE_LENGTH = 5.0;
const float HUGE = 9E16;
const float PI = 3.14159265;
const float TAU = 6.283185307;

#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i)/(m)+.5)*(m))

layout (location = 0) out vec4 fragCompute0;
layout (location = 1) out vec4 fragCompute1;

uniform bool init;
uniform bool shouldUpdate;
uniform float time;
uniform float beat;
uniform float trails;
uniform float trailLength;
uniform float totalFrame;
uniform float deltaTime;
uniform vec2 resolution;
uniform sampler2D samplerCompute0;
uniform sampler2D samplerCompute1;
uniform sampler2D samplerRandom;
uniform float noiseScale;
uniform float noisePhase;
// uniform float velScale;
// uniform float genRate;

// ------

vec2 uvInvT( vec2 _uv ) {
  return vec2( 0.0, 1.0 ) + vec2( 1.0, -1.0 ) * _uv;
}

// ------

mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

float fractSin( float i ) {
  return fract( sin( i ) * 1846.42 );
}

vec4 sampleRandom( vec2 _uv ) {
  return texture( samplerRandom, _uv );
}

#pragma glslify: prng = require( ./-prng );
#pragma glslify: cyclicNoise = require( ./modules/cyclicNoise );

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

float uneune( float i, float p ) {
  return sin( TAU * (
    fractSin( i ) + floor( 1.0 + 4.0 * fractSin( i + 54.12 ) ) * p
  ) );
}

vec3 uneune3( float i, float p ) {
  return vec3( uneune( i, p ), uneune( i + 11.87, p ), uneune( i + 21.92, p ) );
}

// ------

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;

  float dt = deltaTime;

  // == if it is not head of particles =============================================================
  if ( 1.0 < gl_FragCoord.x ) {
    if ( shouldUpdate ) {
      uv.x -= 1.0 / resolution.x;
    }

    vec4 tex0 = texture( samplerCompute0, uv );
    vec4 tex1 = texture( samplerCompute1, uv );

    if ( shouldUpdate ) {
      tex0.w = saturate( tex0.w - 1.0 / trailLength ); // decrease the life
    }

    fragCompute0 = tex0;
    fragCompute1 = tex1;

    return;
  }

  // == prepare some vars ==========================================================================
  vec4 seed = texture( samplerRandom, uv );
  prng( seed );

  vec4 tex0 = texture( samplerCompute0, uv );
  vec4 tex1 = texture( samplerCompute1, uv );

  vec3 pos = tex0.xyz;
  float life = tex0.w;
  vec3 vel = tex1.xyz;
  float jumpFlag = tex1.w;

  float timing = mix( 0.0, PARTICLE_LIFE_LENGTH, floor( uv.y * trails ) / trails );
  timing += lofi( time, PARTICLE_LIFE_LENGTH );

  if ( time - deltaTime + PARTICLE_LIFE_LENGTH < timing ) {
    timing -= PARTICLE_LIFE_LENGTH;
  }

  // == initialize particles =======================================================================
  if (
    time - deltaTime < timing && timing <= time
  ) {
    dt = time - timing;

    pos = 1.0 * randomSphere( seed );

    vel = 1.0 * randomSphere( seed );

    life = 1.0;

    jumpFlag = 1.0;
  } else {
    jumpFlag = 0.0; // remove jumping flag
  }

  // == update particles ===========================================================================
  // noise field
  vel += 40.0 * cyclicNoise( pos ) * dt;

  // resistance
  vel *= exp( -10.0 * dt );
  // vel.z += 10.0 * dt;

  vec3 v = vel;
  // float vmax = max( abs( v.x ), max( abs( v.y ), abs( v.z ) ) );
  // v *= (
  //   abs( v.x ) == vmax ? vec3( 1.0, 0.0, 0.0 ) :
  //   abs( v.y ) == vmax ? vec3( 0.0, 1.0, 0.0 ) :
  //   vec3( 0.0, 0.0, 1.0 )
  // );

  // pos.xyz += velScale * v * dt;
  pos += v * dt;
  life -= dt / PARTICLE_LIFE_LENGTH;

  fragCompute0 = vec4( pos, life );
  fragCompute1 = vec4( vel, jumpFlag );
}
