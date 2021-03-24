#pragma glslify: orthBasis = require( ./orthBasis );

vec3 cyclicNoise( vec3 p ) {
  vec3 sum = vec3( 0.0 );
  float amp = 0.5;
  float warp = 1.1;
  mat3 rot = orthBasis( vec3( 0.8,-.5,-.2 ) );

  for ( int i = 0; i < 8; i ++ ) {
    p *= rot * 2.0;
    p += sin( p.zxy * warp );
    sum += sin( cross( cos( p ), sin( p.yzx ) ) ) * amp;
    amp *= 0.5;
    warp *= 1.3;
  }

  return sum;
}

#pragma glslify: export(cyclicNoise)
