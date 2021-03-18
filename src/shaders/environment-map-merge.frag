#version 300 es

precision highp float;

const float PI = 3.14159265;
const float TAU = 6.283185307;

in vec2 vUv;

out vec4 fragColor;

uniform float head;
uniform vec2 resolution;
uniform sampler2D sampler0;

void main() {
  float lv = floor( -log( 1.0 - max( vUv.x, vUv.y ) ) / log( 2.0 ) );

  if ( lv >= 5.0 ) { discard; }

  fragColor = texture( sampler0, vUv );

  if ( lv != floor( -log( 1.0 - min( vUv.x, vUv.y ) ) / log( 2.0 ) ) ) { return; }
  if ( lv < 1.0 ) { return; }

  float p = pow( 0.5, lv + 1.0 );
  vec2 uvt;

  for ( int i = 1; i < 31; i ++ ) {
    uvt = vUv - p * vec2( i, 0.0 );
    if ( uvt.x < 0.0 ) { break; }
    fragColor += texture( sampler0, uvt );
    uvt = vUv - p * vec2( 0.0, i );
    fragColor += texture( sampler0, uvt );
  }

  fragColor = fragColor / fragColor.w;
}
