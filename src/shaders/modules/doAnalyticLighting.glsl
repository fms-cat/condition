const float PI = 3.14159265359;
const float EPSILON = 1E-3;
const vec3 DIELECTRIC_SPECULAR = vec3( 0.04 );
const vec3 ONE_SUB_DIELECTRIC_SPECULAR = 1.0 - DIELECTRIC_SPECULAR;

#pragma glslify: brdfLambert = require( ./brdfLambert.glsl );
#pragma glslify: brdfSpecularGGX = require( ./brdfSpecularGGX.glsl );

vec3 doAnalyticLighting(
  vec3 V,
  vec3 L, // MUST NOT be normalized
  vec3 N,
  vec3 color,
  float roughness,
  float metallic
) {
  vec3 albedo = mix( color * ONE_SUB_DIELECTRIC_SPECULAR, vec3( 0.0 ), metallic );
  vec3 f0 = mix( DIELECTRIC_SPECULAR, color, metallic );

  V = normalize( V );
  float lenL = length( L );
  L = normalize( L );
  vec3 H = normalize( V + L );

  float NdotL = clamp( dot( N, L ), EPSILON, 1.0 );
  float NdotH = clamp( dot( N, H ), EPSILON, 1.0 );
  float VdotH = clamp( dot( V, H ), EPSILON, 1.0 );
  float NdotV = clamp( dot( N, V ), EPSILON, 1.0 );

  float decayL = 1.0 / ( lenL * lenL );

  vec3 diffuse = brdfLambert( f0, albedo, VdotH );
  vec3 spec = brdfSpecularGGX( f0, roughness, VdotH, NdotL, NdotV, NdotH );

  return PI * decayL * NdotL * ( diffuse + spec );
}

#pragma glslify: export(doAnalyticLighting)
