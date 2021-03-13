#version 300 es

precision highp float;

const int AO_ITER = 16;
const float AO_BIAS = 0.0;
const float AO_RADIUS = 0.5;
const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const float EPSILON = 1E-3;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

in vec2 vUv;

out vec4 fragColor;

uniform vec2 resolution;
uniform mat4 cameraPV;
uniform sampler2D sampler0; // position.xyz, depth
uniform sampler2D sampler1; // normal.xyz
uniform sampler2D samplerRandom;

// == commons ======================================================================================
#pragma glslify: prng = require( ./-prng );

vec3 randomDirection( inout vec4 seed ) {
  float phi16_ = TAU * prng( seed );
  float theta = acos( -1.0 + 2.0 * prng( seed ) );

  return vec3(
    sin( theta ) * sin( phi16_ ),
    cos( theta ),
    sin( theta ) * cos( phi16_ )
  );
}

// == features =====================================================================================
float ambientOcclusion( vec2 uv, vec3 position, vec3 normal ) {
  float ao = 0.0;

  vec4 seed = texture( samplerRandom, uv );
  prng( seed );

  for ( int i = 0; i < AO_ITER; i ++ ) {
    vec3 dir = randomDirection( seed ) * prng( seed );
    if ( dot( dir, normal ) < 0.0 ) { dir = -dir; }

    vec4 screenPos = cameraPV * vec4( position + dir * AO_RADIUS, 1.0 );
    screenPos.x *= resolution.y / resolution.x;
    vec2 screenUv = screenPos.xy / screenPos.w * 0.5 + 0.5;
    vec4 s0 = texture( sampler0, screenUv );

    vec3 dDir = s0.xyz - position;
    if ( length( dDir ) < 1E-2 ) {
      ao += 1.0;
    } else {
      float dNor = dot( normalize( normal ), normalize( dDir ) );
      ao += 1.0 - saturate( dNor - AO_BIAS ) / ( length( dDir ) + 1.0 );
    }
  }

  ao = ao / float( AO_ITER );
  return ao;
}

// == main procedure ===============================================================================
void main() {
  vec4 tex0 = texture( sampler0, vUv );
  vec4 tex1 = texture( sampler1, vUv );

  vec3 position = tex0.xyz;
  vec3 normal = tex1.xyz;

  float ao = ambientOcclusion( vUv, position, normal );
  fragColor = vec4( vec3( ao ), 1.0 );
}
