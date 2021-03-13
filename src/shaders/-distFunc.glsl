float fractSin( float i ) {
  return fract( sin( i ) * 1846.42 );
}

// https://www.iquilezles.org/www/articles/smin/smin.htm
float smin( float a, float b, float k ) {
  float h = max( k - abs( a - b ), 0.0 ) / k;
  return min( a, b ) - h * h * h * k * ( 1.0 / 6.0 );
}

mat2 rot2d( float t ) {
  float c = cos( t );
  float s = sin( t );
  return mat2( c, -s, s, c );
}

vec3 ifs( vec3 p, vec3 r, vec3 t ) {
  vec3 s = t;

  for ( int i = 0; i < 5; i ++ ) {
    p = abs( p ) - abs( s ) * pow( 0.5, float( i ) );

    s.yz = rot2d( r.x ) * s.yz;
    s.zx = rot2d( r.y ) * s.zx;
    s.xy = rot2d( r.z ) * s.xy;

    p.xy = p.x < p.y ? p.yx : p.xy;
    p.yz = p.y < p.z ? p.zy : p.yz;
    p.xz = p.x < p.z ? p.zx : p.xz;
  }

  return p;
}

float box( vec3 p, vec3 d ) {
  vec3 absp = abs( p );
  return max( ( absp.x - d.x ), max( ( absp.y - d.y ), ( absp.z - d.z ) ) );
}

float distFunc( vec3 p, float time ) {
  float dist = 1E9;
  for ( int i = 0; i < 5; i ++ ) {
    float fi = float( i );
    vec3 trans = 0.5 * vec3(
      sin( 6.0 * fractSin( fi * 2.874 ) + time * ( 1.0 + fractSin( fi * 2.271 ) ) ),
      sin( 6.0 * fractSin( fi * 4.512 ) + time * ( 1.0 + fractSin( fi * 1.271 ) ) ),
      sin( 6.0 * fractSin( fi * 3.112 ) + time * ( 1.0 + fractSin( fi * 3.271 ) ) )
    );
    dist = smin( dist, length( p - trans ) - 0.5, 1.0 );
  }
  return dist;
}

#pragma glslify: export(distFunc)
