// Ref: https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/38b88e365728d7b2e28a78a57d84be2675fdb70d/source/Renderer/shaders/brdf.glsl

const float PI = 3.14159265;
const vec3 DIELECTRIC_SPECULAR = vec3( 0.04 );

vec3 brdfSpecularGGX( vec3 f0, float roughness, float VdotH, float NdotL, float NdotV, float NdotH ) {
  // F_Schlick
  vec3 F = f0 + ( 1.0 - f0 ) * pow( max( 0.0, 1.0 - VdotH ), 5.0 );

  // V_GGX
  float roughnessSq = roughness * roughness;

  float GGXV = NdotL * sqrt( NdotV * NdotV * ( 1.0 - roughnessSq ) + roughnessSq );
  float GGXL = NdotV * sqrt( NdotL * NdotL * ( 1.0 - roughnessSq ) + roughnessSq );

  float GGX = GGXV + GGXL;
  float Vis = ( 0.0 < GGX ) ? ( 0.5 / GGX ) : 0.0;

  // D_GGX
  float f = ( NdotH * NdotH ) * ( roughnessSq - 1.0 ) + 1.0;
  float D = roughnessSq / ( PI * f * f );

  return F * Vis * D;
}

#pragma glslify: export(brdfSpecularGGX)
