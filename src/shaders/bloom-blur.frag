#version 300 es

precision highp float;

const float OFFSET1 = 1.411764705882353;
const float OFFSET2 = 3.2941176470588234;
const float OFFSET3 = 5.176470588235294;
const float CONTRIBUTION0 = 0.1964825501511404;
const float CONTRIBUTION1 = 0.2969069646728344;
const float CONTRIBUTION2 = 0.09447039785044732;
const float CONTRIBUTION3 = 0.010381362401148057;

in vec2 vUv;

out vec4 fragColor;

uniform bool isVert;
uniform vec2 resolution;
uniform sampler2D sampler0;

void main() {
  vec2 halfTexel = 1.0 / resolution; // * 0.5;

  float lv = ceil( -log( 1.0 - min( vUv.x, vUv.y ) ) / log( 2.0 ) );
  float p = pow( 0.5, lv );
  vec2 clampMin = floor( vUv / p ) * p + halfTexel;
  vec2 clampMax = clampMin + p - 2.0 * halfTexel;

  vec2 bv = halfTexel * ( isVert ? vec2( 0.0, 1.0 ) : vec2( 1.0, 0.0 ) );
  vec4 sum = vec4( 0.0 );

  sum += CONTRIBUTION0 * texture( sampler0, vUv );
  vec2 suv = clamp( vUv - bv * OFFSET1, clampMin, clampMax );
  sum += CONTRIBUTION1 * texture( sampler0, suv );
  suv = clamp( vUv + bv * OFFSET1, clampMin, clampMax );
  sum += CONTRIBUTION1 * texture( sampler0, suv );
  suv = clamp( vUv - bv * OFFSET2, clampMin, clampMax );
  sum += CONTRIBUTION2 * texture( sampler0, suv );
  suv = clamp( vUv + bv * OFFSET2, clampMin, clampMax );
  sum += CONTRIBUTION2 * texture( sampler0, suv );
  suv = clamp( vUv - bv * OFFSET3, clampMin, clampMax );
  sum += CONTRIBUTION3 * texture( sampler0, suv );
  suv = clamp( vUv + bv * OFFSET3, clampMin, clampMax );
  sum += CONTRIBUTION3 * texture( sampler0, suv );

  fragColor = vec4( sum.xyz, 1.0 );
}
