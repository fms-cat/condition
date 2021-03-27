#pragma glslify: uniformSphere = require( ./uniformSphere );

vec3 uniformHemisphere( vec2 Xi, vec3 n ) {
  vec3 d = uniformSphere( Xi );
  return dot( n, d ) < 0.0 ? -d : d;
}

#pragma glslify: export(uniformHemisphere)
