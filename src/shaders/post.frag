#version 300 es

precision highp float;

const int BARREL_ITER = 10;
const float BARREL_OFFSET = 0.05;
const float BARREL_AMP = 0.05;
const float HUGE = 9E16;
const float PI = 3.14159265;

#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))

in vec2 vUv;

out vec4 fragColor;

uniform float time;
uniform vec2 resolution;
uniform sampler2D sampler0;

vec3 colorMap( vec3 i ) {
  return vec3(
    smoothstep( 0.0, 1.0, i.r ),
    i.g,
    0.1 + 0.8 * i.b
  );
}

vec3 barrel( float amp, vec2 uv ) {
  float corn = length( vec2( 0.5 ) );
  float a = min( 3.0 * sqrt( amp ), corn * PI );
  float zoom = corn / ( tan( corn * a ) + corn );
  vec2 p = saturate(
    ( uv + normalize( uv - 0.5 ) * tan( length( uv - 0.5 ) * a ) ) * zoom +
    0.5 * ( 1.0 - zoom )
  );
  return texture( sampler0, vec2( p.x, p.y ) ).xyz;
}

void main() {
  vec2 uv = vUv;
  vec2 p = ( uv * resolution * 2.0 - resolution ) / resolution.y;
  float vig = 1.0 - length( p ) * 0.2;

  vec3 tex = vec3( 0.0 );

  for ( int i = 0; i < BARREL_ITER; i ++ ) {
    float fi = ( float( i ) + 0.5 ) / float( BARREL_ITER );
    vec3 a = saturate( vec3(
      1.0 - 3.0 * abs( 1.0 / 6.0 - fi ),
      1.0 - 3.0 * abs( 1.0 / 2.0 - fi ),
      1.0 - 3.0 * abs( 5.0 / 6.0 - fi )
    ) ) / float( BARREL_ITER ) * 4.0;
    tex += a * barrel( BARREL_OFFSET + BARREL_AMP * fi, uv );
  }

  tex = mix( vec3( 0.0 ), tex, vig );

  vec3 col = pow( saturate( tex.xyz ), vec3( 0.4545 ) );
  col.x = linearstep( 0.0, 1.2, col.x + 0.2 * uv.y );
  col = colorMap( col );

  fragColor = vec4( col, 1.0 );
}
