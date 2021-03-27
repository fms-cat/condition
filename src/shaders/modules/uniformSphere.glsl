vec3 uniformSphere( vec2 Xi ) {
  float p = 2.0 * PI * Xi.x;
  float t = acos( 1.0 - 2.0 * Xi.y );
  return vec3( cos( p ) * sin( t ), cos( t ), sin( p ) * sin( t ) );
}

#pragma glslify: export(uniformSphere)
