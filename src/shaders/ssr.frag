#version 300 es

precision highp float;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

vec4 seed;

in vec2 vUv;

out vec4 fragColor;

uniform vec2 resolution;
uniform vec2 cameraNearFar;
uniform vec3 cameraPos;
uniform mat4 cameraView;
uniform mat4 cameraPV;
uniform sampler2D sampler0; // position.xyz, depth
uniform sampler2D sampler1; // normal.xyz
uniform sampler2D sampler2; // color.rgba
uniform sampler2D sampler3; // materialParams.xyz, materialId
uniform sampler2D samplerShaded;
uniform sampler2D samplerRandom;

#pragma glslify: prng = require( ./-prng );

// == structs ======================================================================================
struct Isect {
  vec2 screenUv;
  vec3 color;
  vec3 position;
  float depth;
  vec3 normal;
  int materialId;
  vec3 materialParams;
};

// == main procedure ===============================================================================
void main() {
  vec4 tex0 = texture( sampler0, vUv );
  vec4 tex1 = texture( sampler1, vUv );
  vec4 tex2 = texture( sampler2, vUv );
  vec4 tex3 = texture( sampler3, vUv );
  vec4 shaded = texture( samplerShaded, vUv );

  Isect isect;
  isect.screenUv = vUv;
  isect.position = tex0.xyz;
  isect.depth = tex0.w;
  isect.normal = normalize( tex1.xyz );
  isect.color = tex2.rgb;
  isect.materialId = int( tex3.w + 0.5 );
  isect.materialParams = tex3.xyz;

  vec3 ssr = vec3( 0.0 );

  if ( isect.materialId != 1 ) {
    seed = texture( samplerRandom, vUv ) * 1919.810;
    prng( seed );

    // from isect
    vec3 V = cameraPos - isect.position;
    float lenV = length( V );
    V = normalize( V );

    // ssr
    vec3 refl = reflect( -V, clamp( isect.normal, -1.0, 1.0 ) );
    float reflLen = 0.0;

    for ( int i = 0; i < 9; i ++ ) {
      reflLen += 0.1 + 0.01 * prng( seed );

      vec3 reflP = isect.position + reflLen * refl;
      vec4 reflSP = cameraPV * vec4( reflP, 1.0 );
      reflSP.x *= resolution.y / resolution.x;
      reflSP /= reflSP.w;

      vec2 reflUv = 0.5 + 0.5 * reflSP.xy;
      float outOfScreenMul = smoothstep( 0.5, 0.4, abs( reflUv.x - 0.5 ) );
      outOfScreenMul *= smoothstep( 0.5, 0.4, abs( reflUv.y - 0.5 ) );

      vec4 reflTexPos = texture( sampler0, reflUv );
      if ( reflSP.z > reflTexPos.w ) {
        float diff = length( reflP.xyz - reflTexPos.xyz );
        ssr += texture( samplerShaded, reflUv ).xyz * outOfScreenMul * exp( -3.0 * reflLen ) * exp( -10.0 * diff );
        break;
      }
    }
  }

  fragColor = vec4( shaded.xyz + ssr, 1.0 );
}
