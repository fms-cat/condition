#version 300 es

precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform float amp;
uniform vec2 resolution;
uniform sampler2D sampler0;

void main() {
  vec2 uv = vUv;
  uv.y = 1.0 - uv.y;

  float shape = texture( sampler0, uv ).w;
  shape = pow( shape, 2.2 );

  float blur = 0.0;

  for ( int i = -10; i < 10; i ++ ) {
    float t = texture( sampler0, uv + vec2( 4 * i, 0.0 ) / resolution ).w;
    blur += exp( -0.2 * abs( float( i ) ) ) * pow( t, 2.2 );
  }

  fragColor = amp * vec4( shape + 0.03 * blur );
}
