#version 300 es

precision highp float;

const int MTL_NONE = 0;
const int MTL_UNLIT = 1;
const int MTL_PBR = 2;
const int MTL_REFRACT = 3;
const int MTL_PSY = 4;
const float ENV_UV_MARGIN = 0.9375;
const float AO_BIAS = 0.0;
const float AO_RADIUS = 0.5;
const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const float EPSILON = 1E-3;
const vec3 BLACK = vec3( 0.0 );
const vec3 DIELECTRIC_SPECULAR = vec3( 0.04 );
const vec3 ONE_SUB_DIELECTRIC_SPECULAR = 1.0 - DIELECTRIC_SPECULAR;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

vec4 seed;

in vec2 vUv;

out vec4 fragColor;

uniform int lightCount;
uniform vec2 resolution;
uniform vec2 lightNearFar[8];
uniform vec2 cameraNearFar;
uniform vec3 cameraPos;
uniform vec3 lightPos[8];
uniform vec3 lightColor[8];
uniform vec4 lightParams[8];
uniform mat4 lightPV[8];
uniform mat4 cameraView;
uniform mat4 cameraPV;
uniform sampler2D sampler0; // position.xyz, depth
uniform sampler2D sampler1; // normal.xyz (yes, this is not good)
uniform sampler2D sampler2; // color.rgba (what is a though????)
uniform sampler2D sampler3; // materialParams.xyz, materialId
uniform sampler2D samplerShadow[8];
uniform sampler2D samplerIBLLUT;
uniform sampler2D samplerEnv;
uniform sampler2D samplerAo;
uniform sampler2D samplerRandom;

// == commons ======================================================================================
#pragma glslify: prng = require( ./-prng );
#pragma glslify: importanceSampleGGX = require( ./modules/importanceSampleGGX.glsl );
#pragma glslify: doAnalyticLighting = require( ./modules/doAnalyticLighting.glsl );
#pragma glslify: doShadowMapping = require( ./modules/doShadowMapping.glsl );

vec3 catColor( float _p ) {
  return 0.5 + 0.5 * vec3(
    cos( _p ),
    cos( _p + PI / 3.0 * 4.0 ),
    cos( _p + PI / 3.0 * 2.0 )
  );
}

vec4 sampleEnvNearest( vec2 uv, float lv ) {
  float p = pow( 0.5, float( lv ) );
  vec2 uvt = ENV_UV_MARGIN * ( uv - 0.5 ) + 0.5;
  uvt = mix( vec2( 1.0 - p ), vec2( 1.0 - 0.5 * p ), uvt );
  return texture( samplerEnv, uvt );
}

vec4 sampleEnvLinear( vec2 uv, float lv ) {
  return mix(
    sampleEnvNearest( uv, floor( lv ) ),
    sampleEnvNearest( uv, floor( lv + 1.0 ) ),
    fract( lv )
  );
}

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

// == this is BAD ==================================================================================
vec4 fetchShadowMap( int iLight, vec2 uv ) {
  if ( iLight == 0 ) {
    return texture( samplerShadow[ 0 ], uv );
  } else if ( iLight == 1 ) {
    return texture( samplerShadow[ 1 ], uv );
  } else if ( iLight == 2 ) {
    return texture( samplerShadow[ 2 ], uv );
  } else if ( iLight == 3 ) {
    return texture( samplerShadow[ 3 ], uv );
  } else if ( iLight == 4 ) {
    return texture( samplerShadow[ 4 ], uv );
  } else if ( iLight == 5 ) {
    return texture( samplerShadow[ 5 ], uv );
  } else if ( iLight == 6 ) {
    return texture( samplerShadow[ 6 ], uv );
  } else if ( iLight == 7 ) {
    return texture( samplerShadow[ 7 ], uv );
  }
}

// == features =====================================================================================
float castShadow( int iLight, vec2 lightUv, Isect isect, float NdotL ) {
  float depth = linearstep(
    lightNearFar[ iLight ].x,
    lightNearFar[ iLight ].y,
    length( isect.position - lightPos[ iLight ] )
  );

  float bias = 0.0001 + 0.0001 * ( 1.0 - NdotL );
  depth -= bias;

  vec4 tex = fetchShadowMap( iLight, lightUv );

  float edgeClip = smoothstep( 0.4, 0.5, max( abs( lightUv.x - 0.5 ), abs( lightUv.y - 0.5 ) ) );

  float variance = saturate( tex.y - tex.x * tex.x );
  float md = depth - tex.x;
  float p = linearstep( 0.2, 1.0, variance / ( variance + md * md ) );

  float softShadow = md < 0.0 ? 1.0 : p;

  return mix(
    softShadow,
    1.0,
    edgeClip
  );
}

float calcDepth( vec3 pos ) {
  float dist = length( cameraPos - pos );
  float near = cameraNearFar.x;
  float far = cameraNearFar.y;
  return linearstep( near, far, dist );
}

// == shading functions ============================================================================
vec3 shadePBR( Isect isect ) {
  // ref: https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/master/src/shaders/metallic-roughness.frag

  // from isect
  vec3 V = cameraPos - isect.position;
  float lenV = length( V );
  V = normalize( V );

  float NdotV = clamp( dot( isect.normal, V ), EPSILON, 1.0 );

  float roughness = isect.materialParams.x;
  float metallic = isect.materialParams.y;
  float emissive = isect.materialParams.z;

  // calc material stuff
  vec3 albedo = mix( isect.color * ONE_SUB_DIELECTRIC_SPECULAR, vec3( 0.0 ), metallic );
  vec3 f0 = mix( DIELECTRIC_SPECULAR, isect.color, metallic );

  float ao = texture( samplerAo, isect.screenUv ).x;

  // begin lighting
  vec3 color = vec3( 0.0 );

  // for each lights
  for ( int iLight = 0; iLight < 8; iLight ++ ) {
    if ( iLight >= lightCount ) { break; }

    vec3 L = lightPos[ iLight ] - isect.position;

    // shading
    vec3 shade = doAnalyticLighting(
      V,
      L,
      isect.normal,
      isect.color,
      roughness,
      metallic
    ) * lightColor[ iLight ] * ao;

    // fetch shadowmap + spot lighting
    vec4 lightProj = lightPV[ iLight ] * vec4( isect.position, 1.0 );
    vec2 lightP = lightProj.xy / lightProj.w;

    shade *= doShadowMapping(
      L,
      isect.normal,
      fetchShadowMap( iLight, 0.5 + 0.5 * lightP ),
      lightP,
      lightNearFar[ iLight ],
      lightParams[ iLight ].x
    );

    color += shade;
  }

  // cheat the texture seam using noise!
  vec3 nEnvDiffuse = importanceSampleGGX( vec2( prng( seed ), prng( seed ) * 0.05 ), 2.0, isect.normal );

  // diffuse ibl
  vec2 uvEnvDiffuse = vec2(
    0.5 + atan( nEnvDiffuse.x, nEnvDiffuse.z ) / TAU,
    0.5 + atan( nEnvDiffuse.y, length( nEnvDiffuse.zx ) ) / PI
  );
  vec3 texEnvDiffuse = sampleEnvNearest( uvEnvDiffuse, 4.0 ).rgb;
  color += ao * texEnvDiffuse * albedo;

  // reflective ibl
  vec3 reflEnvReflective = reflect( -V, isect.normal );
  vec2 uvEnvReflective = vec2(
    0.5 + atan( reflEnvReflective.x, reflEnvReflective.z ) / TAU,
    0.5 + atan( reflEnvReflective.y, length( reflEnvReflective.zx ) ) / PI
  );
  vec2 brdfEnvReflective = texture( samplerIBLLUT, vec2( NdotV, roughness ) ).xy;
  vec3 texEnvReflective = sampleEnvLinear( uvEnvReflective, 3.0 * roughness ).rgb;
  color += ao * texEnvReflective * ( brdfEnvReflective.x * f0 + brdfEnvReflective.y );

  // emissive
  color += emissive * NdotV * isect.color;

  return color;

}

// == main procedure ===============================================================================
void main() {
  vec4 tex0 = texture( sampler0, vUv );
  vec4 tex1 = texture( sampler1, vUv );
  vec4 tex2 = texture( sampler2, vUv );
  vec4 tex3 = texture( sampler3, vUv );

  seed = texture( samplerRandom, vUv ) * 1919.810;
  prng( seed );

  Isect isect;
  isect.screenUv = vUv;
  isect.position = tex0.xyz;
  isect.depth = tex0.w;
  isect.normal = normalize( tex1.xyz );
  isect.color = tex2.rgb;
  isect.materialId = int( tex3.w + 0.5 );
  isect.materialParams = tex3.xyz;

  // from isect
  vec3 V = cameraPos - isect.position;
  float lenV = length( V );
  V = normalize( V );

  float NdotV = clamp( dot( isect.normal, V ), EPSILON, 1.0 );

  vec3 color = vec3( 0.0 );

  if ( isect.materialId == MTL_NONE ) {
    // do nothing

  } else if ( isect.materialId == MTL_UNLIT ) {
    color = isect.color;

  } else if ( isect.materialId == MTL_PBR ) {
    color = shadePBR( isect );

  } else if ( isect.materialId == MTL_REFRACT ) {
    color = shadePBR( isect );

    // really really cheap full spectrum
    vec3 refrEnvRefractive = refract( -V, isect.normal, 1.0 / 2.56 );
    vec2 uvEnvRefractive = vec2(
      0.5 + atan( refrEnvRefractive.x, refrEnvRefractive.z ) / TAU,
      0.5 + atan( refrEnvRefractive.y, length( refrEnvRefractive.zx ) ) / PI
    );
    vec3 texEnvRefractive = sampleEnvLinear( uvEnvRefractive, 0.5 ).rgb;

    color += isect.color * texEnvRefractive;

  } else if ( isect.materialId == MTL_PSY ) {
    color = 0.02 * smoothstep( 0.9, 1.0, texture( samplerAo, isect.screenUv ).xyz );

    // vec2 f = ( 1.0 - 2.0 * prng( seed ) ) / resolution;
    vec2 f = 1.0 / resolution;
    vec4 tex0x = texture( sampler0, vUv + f );
    vec4 tex1x = texture( sampler1, vUv + f );
    vec4 tex3x = texture( sampler3, vUv + f );

    float valid = MTL_PSY == int( tex3x.w ) ? 1.0 : 0.0;

    float edge = saturate(
      step( 0.1, abs( length( cameraPos - tex0x.xyz ) - lenV ) ) +
      step( 0.1, length( tex1x.xyz - tex1.xyz ) )
    ) * valid;

    vec3 gradient = 0.5 + 0.5 * cos(
      3.0 + 1.5 * exp( -0.4 * max( lenV - 3.0, 0.0 ) ) + vec3( 0.0, 2.0, 4.0 )
    );
    color += 0.4 * gradient * edge;

  }

  color *= exp( -0.4 * max( lenV - 3.0, 0.0 ) );

  // color = 0.5 + 0.5 * isect.normal;
  // color = vec3( calcDepth( tex0.xyz ) );
  // color = vec3( 0.5, 0.2, 0.9 ) * ( 1.0 - texture( samplerAo, isect.screenUv ).xyz );
  // color = mix(
  //   color,
  //   vec3( 0.96 ) * smoothstep( 0.5, 0.9, texture( samplerAo, isect.screenUv ).xyz ),
  //   1.0
  // );

  fragColor = vec4( color, 1.0 );
  // fragColor.xyz *= smoothstep( 1.0, 0.7, calcDepth( tex0.xyz ) );

  gl_FragDepth = 0.5 + 0.5 * isect.depth;
}
