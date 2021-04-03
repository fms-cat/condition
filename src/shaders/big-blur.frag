#version 300 es

precision highp float;

const float PI = 3.14159265;

in vec2 vUv;

out vec4 fragColor;

uniform float ratio;
uniform float sigma;
uniform vec2 resolution;
uniform sampler2D sampler0;

float gaussian( float x ) {
  return 1.0 / sqrt( 2.0 * PI * sigma ) * exp( - x * x / 2.0 / sigma );
}

void main() {
  vec2 bv;

#ifdef IS_VERTICAL
  bv = vec2( 0.0, 4.0 ) / resolution;
#else
  bv = vec2( 4.0, 0.0 ) / resolution;
#endif

  vec4 sum = vec4( 0.0 );

  for ( int i = -100; i < 100; i ++ ) {
    float fi = float( i );
    vec2 uvt = vUv + fi * bv;
    if ( abs( uvt.x - 0.5 ) < 0.5 && abs( uvt.y - 0.5 ) < 0.5 ) {
      sum += gaussian( fi ) * texture( sampler0, uvt );
    }
  }

  fragColor = mix( texture( sampler0, vUv ), sum / sum.w, ratio );
}
