#version 300 es

precision highp float;

const float TAU = 6.283185307;

in vec2 vUv;

out vec4 fragColor;

uniform float samples;
uniform float vdc;
uniform sampler2D sampler0;

vec3 ImportanceSampleGGX( vec2 Xi, float roughness, vec3 N ) {
  float a = roughness * roughness;

  float phi = TAU * Xi.x;
  float cosTheta = sqrt( ( 1.0 - Xi.y ) / ( 1.0 + ( a * a - 1.0 ) * Xi.y ) );
  float sinTheta = sqrt( 1.0 - cosTheta * cosTheta );

  // from spherical coordinates to cartesian coordinates
  vec3 H = vec3(
    cos( phi ) * sinTheta,
    sin( phi ) * sinTheta,
    cosTheta
  );

  // from tangent-space vector to world-space sample vector
  vec3 up = abs( N.y ) < 0.999 ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
  vec3 tangent = normalize( cross( up, N ) );
  vec3 bitangent = cross( N, tangent );

  vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
  return normalize( sampleVec );
}

float GeometrySchlickGGX( float NdotV, float roughness ) {
  float a = roughness;
  float k = ( a * a ) / 2.0;

  float nom = NdotV;
  float denom = NdotV * ( 1.0 - k ) + k;

  return nom / denom;
}

float GeometrySmith( float roughness, float NoV, float NoL ) {
  float ggx2 = GeometrySchlickGGX( NoV, roughness );
  float ggx1 = GeometrySchlickGGX( NoL, roughness );

  return ggx1 * ggx2;
}

// https://github.com/HectorMF/BRDFGenerator/blob/master/BRDFGenerator/BRDFGenerator.cpp
vec2 IntegrateBRDF( float NdotV, float roughness ) {
  vec3 V = vec3( sqrt( 1.0 - NdotV * NdotV ), 0.0, NdotV );
  vec3 N = vec3( 0.0, 0.0, 1.0 );

  vec2 Xi = vec2( samples / 1024.0, vdc );
  vec3 H = ImportanceSampleGGX( Xi, roughness, N );
  vec3 L = normalize( 2.0 * dot( V, H ) * H - V );

  float NoL = max( L.z, 0.0 );
  float NoH = max( H.z, 0.0 );
  float VoH = max( dot( V, H ), 0.0 );
  float NoV = max( dot( N, V ), 0.0 );

  if ( NoL > 0.0 ) {
    float G = GeometrySmith( roughness, NoV, NoL );

    float G_Vis = ( G * VoH ) / ( NoH * NoV );
    float Fc = pow( 1.0 - VoH, 5.0 );

    return vec2( ( 1.0 - Fc ) * G_Vis, Fc * G_Vis );
  }

  return vec2( 0.0 );
}

void main() {
  vec2 tex = texture( sampler0, vUv ).xy;

  float NdotV = vUv.y;
  float roughness = vUv.x;

  tex = mix( tex, IntegrateBRDF( NdotV, roughness ), 1.0 / samples );

  fragColor = vec4( tex, 0.0, 1.0 );
}
