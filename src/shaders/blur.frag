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

uniform vec2 resolution;
uniform sampler2D sampler0;

void main() {
  vec2 bv;

#ifdef IS_VERTICAL
  bv = vec2( 0.0, 1.0 ) / resolution;
#else
  bv = vec2( 1.0, 0.0 ) / resolution;
#endif

  vec4 sum = vec4( 0.0 );

  sum += CONTRIBUTION0 * texture( sampler0, vUv );
  vec2 uvt = vUv - bv * OFFSET1;
  sum += CONTRIBUTION1 * texture( sampler0, uvt );
  uvt = vUv + bv * OFFSET1;
  sum += CONTRIBUTION1 * texture( sampler0, uvt );
  uvt = vUv - bv * OFFSET2;
  sum += CONTRIBUTION2 * texture( sampler0, uvt );
  uvt = vUv + bv * OFFSET2;
  sum += CONTRIBUTION2 * texture( sampler0, uvt );
  uvt = vUv - bv * OFFSET3;
  sum += CONTRIBUTION3 * texture( sampler0, uvt );
  uvt = vUv + bv * OFFSET3;
  sum += CONTRIBUTION3 * texture( sampler0, uvt );

  fragColor = vec4( sum.xyz, 1.0 );
}
