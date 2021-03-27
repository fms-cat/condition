#version 300 es

precision highp float;

const int DECODE_ITER = 10;
const float INV_DECODE_ITER = 1.0 / float( DECODE_ITER );
const float DECODE_PERIOD = 2.0;
const float CHROMA_AMP = 0.4;
const float PI = 3.14159265;
const float TAU = PI * 2.0;
const vec2 CHROMA_FREQ = vec2( 227.5, 120.0 );
const mat3 YCBCR_TO_RGB = mat3( 1.0, 1.0, 1.0, 0.0, -0.344136, 1.772, 1.402, -0.714136, 0.0 );

#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))

in vec2 vUv;

out vec4 fragColor;

uniform float time;
uniform vec2 resolution;
uniform sampler2D sampler0;

// https://www.shadertoy.com/view/3sKSzW
void main() {
  // YCbCr
  float y = 0.0;
  vec2 cbcr = vec2( 0.0 );

  // sample
  vec2 sampleOffset = vec2( 1.0, 0.0 ) / CHROMA_FREQ.x * DECODE_PERIOD * INV_DECODE_ITER;
  for ( int i = -DECODE_ITER / 2; i < DECODE_ITER / 2; i ++ ) {
    vec2 uvt = vUv - float( i ) * sampleOffset;
    float tex = texture( sampler0, uvt ).x * INV_DECODE_ITER;
    y += tex;
    float phase = TAU * dot( CHROMA_FREQ, uvt );
    cbcr += tex * vec2( cos( phase ), sin( phase ) );
  }

  // back to rgb
  vec3 col = YCBCR_TO_RGB * vec3(
    saturate( 1.2 * ( linearstep( CHROMA_AMP, 1.0 - CHROMA_AMP, y ) - 0.5 ) + 0.5 ),
    PI * cbcr / CHROMA_AMP
  );

  fragColor = vec4( col, 1.0 );
}
