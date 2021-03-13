#version 300 es

precision highp float;

const float PARTICLE_LIFE_LENGTH = 5.0;
const float HUGE = 9E16;
const float PI = 3.14159265;
const float TAU = 6.283185307;

#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i)/(m)+.5)*(m))

// ------

out vec4 fragColor;

uniform float time;
uniform float beat;

uniform float trails;
uniform float trailLength;
uniform float ppp;

uniform float totalFrame;
uniform bool init;
uniform float deltaTime;
uniform vec2 resolution;

uniform sampler2D samplerCompute;
uniform sampler2D samplerRandom;

uniform float noiseScale;
uniform float noisePhase;
// uniform float velScale;
// uniform float genRate;

// ------

#pragma glslify: distFunc = require( ./-distFunc );

float fDistFunc( vec3 p ) {
  return distFunc( p, time );
}

vec3 normalFunc( vec3 p, float dd ) {
  vec2 d = vec2( 0.0, dd );
  return normalize( vec3(
    fDistFunc( p + d.yxx ) - fDistFunc( p - d.yxx ),
    fDistFunc( p + d.xyx ) - fDistFunc( p - d.xyx ),
    fDistFunc( p + d.xxy ) - fDistFunc( p - d.xxy )
  ) );
}

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
#pragma glslify: noise = require( ./-simplex4d );

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
  vec2 puv = vec2( ( floor( gl_FragCoord.x / ppp ) * ppp + 0.5 ) / resolution.x, uv.y );
  float pixId = mod( gl_FragCoord.x, ppp );
  vec2 dpix = vec2( 1.0 ) / resolution;

  float dt = deltaTime;

  // == if it is not head of particles =============================================================
  if ( ppp < gl_FragCoord.x ) {
    puv.x -= ppp / resolution.x;
    vec4 tex0 = texture( samplerCompute, puv );
    vec4 tex1 = texture( samplerCompute, puv + dpix * vec2( 1.0, 0.0 ) );

    tex0.w = saturate( tex0.w - 1.0 / trailLength ); // decrease the life

    fragColor = (
      pixId < 1.0 ? tex0 :
      tex1
    );
    return;
  }

  // == prepare some vars ==========================================================================
  vec4 seed = texture( samplerRandom, puv );
  prng( seed );

  vec4 tex0 = texture( samplerCompute, puv );
  vec4 tex1 = texture( samplerCompute, puv + dpix * vec2( 1.0, 0.0 ) );

  vec3 pos = tex0.xyz;
  float life = tex0.w;
  vec3 vel = tex1.xyz;
  float jumpFlag = tex1.w;

  float timing = mix( 0.0, PARTICLE_LIFE_LENGTH, floor( puv.y * trails ) / trails );
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
  // distFunc
  float dist = fDistFunc( pos.xyz ) - 0.2;
  vec3 nor = normalFunc( pos.xyz, 1E-4 );
  vel -= dt * 100.0 * dist * nor;

  // spin around center
  vel.zx += dt * 20.0 * vec2( -1.0, 1.0 ) * normalize( nor.xz );

  // noise field
  vel += 40.0 * vec3(
    noise( vec4( pos.xyz, 1.485 + sin( time * 0.1 ) + noisePhase ) ),
    noise( vec4( pos.xyz, 3.485 + sin( time * 0.1 ) + noisePhase ) ),
    noise( vec4( pos.xyz, 5.485 + sin( time * 0.1 ) + noisePhase ) )
  ) * dt;

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

  fragColor = (
    pixId < 1.0 ? vec4( pos, life ) :
    vec4( vel, jumpFlag )
  );
}
