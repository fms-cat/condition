// Ref: https://learnopengl.com/PBR/IBL/Specular-IBL

const float TAU = 6.28318530718;

vec3 importanceSampleGGX( vec2 Xi, float roughness, vec3 N ) {
  float a = roughness * roughness;

  float phi = TAU * Xi.x;
  float cosTheta = roughness > 1.0 // use lambert ???
    ? cos( asin( sqrt( Xi.y ) ) )
    : sqrt( ( 1.0 - Xi.y ) / ( 1.0 + ( a * a - 1.0 ) * Xi.y ) );
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

#pragma glslify: export(importanceSampleGGX)
