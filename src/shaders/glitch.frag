#version 300 es

precision highp float;

const int BARREL_ITER = 10;

#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))

in vec2 vUv;

out vec4 fragColor;

uniform float time;
uniform float amp;
uniform float barrelAmp;
uniform float barrelOffset;
uniform vec2 resolution;
uniform sampler2D sampler0;

// == common =======================================================================================
float fractSin( float v ) {
  return fract( 17.351 * sin( 27.119 * v ) );
}

// == glitch =======================================================================================
vec2 displace( vec2 uv, float threshold ) {
  float seed = fractSin( lofi( uv.y, 0.0625 ) + fractSin( lofi( uv.x, 0.25 ) ) );
  if ( seed < threshold ) { return vec2( 0.0 ); }

  vec2 d = vec2( 0.0 );
  seed = fractSin( seed );
  d.x = seed - 0.5;

  return d;
}

// == fetch ========================================================================================
vec4 fetch( vec2 uv ) {
  vec2 uvt = saturate( uv );
  vec4 color = texture( sampler0, uvt );
  return color;
}

// == main procedure ===============================================================================
void main() {
  vec2 uv = vUv.xy;

  vec2 d = vec2( 0.0 );
  for ( int i = 0; i < 3; i ++ ) {
    float p = pow( 2.4, float( i ) );
    float thr = 1.0 - pow( amp, 6.0 );
    thr = thr * pow( thr, float( i ) );
    d += displace( uv * p + 50.0 * fractSin( 0.1 * time ), thr ) * 0.4 / p;
  }

  vec4 col = vec4( 0.0 );
  col += fetch( uv + d * 0.60 ) * vec4( 1.0, 0.0, 0.0, 1.0 );
  col += fetch( uv + d * 0.90 ) * vec4( 0.0, 1.0, 0.0, 1.0 );
  col += fetch( uv + d * 1.20 ) * vec4( 0.0, 0.0, 1.0, 1.0 );

  fragColor = col;
}
