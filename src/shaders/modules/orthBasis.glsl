mat3 orthBasis( vec3 z ) {
  z = normalize( z );
  vec3 up = abs( z.y ) > 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 0.0, 1.0, 0.0 );
  vec3 x = normalize( cross( up, z ) );
  vec3 y = cross( z, x );
  return mat3( x, y, z );
}

#pragma glslify: export(orthBasis)
