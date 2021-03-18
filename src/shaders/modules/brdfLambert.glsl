// Ref: https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/38b88e365728d7b2e28a78a57d84be2675fdb70d/source/Renderer/shaders/brdf.glsl

const float PI = 3.14159265;
const vec3 DIELECTRIC_SPECULAR = vec3( 0.04 );
const vec3 ONE_SUB_DIELECTRIC_SPECULAR = 1.0 - DIELECTRIC_SPECULAR;

vec3 brdfLambert( vec3 f0, vec3 albedo, float VdotH ) {
  // F_Schlick
  vec3 F = f0 + ( 1.0 - f0 ) * pow( max( 0.0, 1.0 - VdotH ), 5.0 );

  return ( 1.0 - F ) * albedo / PI;
}

#pragma glslify: export(brdfLambert)
