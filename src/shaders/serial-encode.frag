#version 300 es

precision highp float;

const int LPF_ITER = 10;
const float INV_LPF_ITER = 1.0 / float( LPF_ITER );
const float LPF_WIDTH = 0.04;
const float CHROMA_AMP = 0.4;
const float DECODE_PERIOD = 2.0;
const float PI = 3.14159265;
const float TAU = PI * 2.0;
const float NOISE_CLUTCH = 0.1;
const vec2 CHROMA_FREQ = vec2( 227.5, 120.0 );
const mat3 RGB_TO_YCBCR = mat3( 0.299, -0.168736, 0.5, 0.587, -0.331264, -0.418688, 0.114, 0.5, -0.081312 );

#define fs(i) (fract(sin((i)*114.514)*1919.810))
#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))

in vec2 vUv;

out vec4 fragColor;

uniform float time;
uniform vec2 resolution;
uniform sampler2D sampler0;

#pragma glslify: cyclicNoise = require( ./modules/cyclicNoise );

// https://www.shadertoy.com/view/3sKSzW
void main() {
  vec2 uv = vUv;

  // prepare random noises
  vec3 noise = cyclicNoise( vec3( uv, time ) );
  vec3 hnoise = cyclicNoise( vec3( vec2( 1.0, 320.0 ) * uv, 100.0 * fract( time ) ) );

  // offsync noise
  vec3 offsyncPos = vec3( vec2( 0.02, 1.0 ) * uv, 0.0 );
  offsyncPos -= vec3( 0.03, 0.2, 1.0 ) * time;
  vec3 offsyncNoise = cyclicNoise( offsyncPos );
  float offsyncAmp = offsyncNoise.y * linearstep( 0.5, 1.0, offsyncNoise.x );
  offsyncAmp *= 1.0 - uv.y;
  float offsyncChromaSup = 1.0 - linearstep( 0.0, 0.1, abs( offsyncAmp ) );

  float phase = TAU * dot( CHROMA_FREQ, uv );

  uv.x += 0.2 * offsyncAmp;
  phase += CHROMA_FREQ.x * 0.05 * offsyncAmp;

  vec4 tex = saturate( texture( sampler0, uv ) );
  vec3 ycbcr = RGB_TO_YCBCR * tex.xyz;

  // chroma signal will be filtered using LPF, this time we're gonna use cheap LPF
  ycbcr.yz *= 0.0;
  for ( int i = 1; i < LPF_ITER; i ++ ) {
      vec2 uvt = uv - vec2( INV_LPF_ITER * LPF_WIDTH * float( i ), 0.0 );
      vec4 tex = saturate( texture( sampler0, uvt ) );
      ycbcr.yz += INV_LPF_ITER * ( RGB_TO_YCBCR * tex.xyz ).yz;
  }

  float signal = ycbcr.x; // y as base level
  signal = mix( CHROMA_AMP, 1.0 - CHROMA_AMP, signal );
  signal += CHROMA_AMP * offsyncChromaSup * (
      ycbcr.y * cos( phase ) +
      ycbcr.z * sin( phase )
  ); // cb as cosine of subcarrier

  // static noise
  signal += 0.01 * ( fs( noise.x ) - 0.5 );

  // high peak noise
  float bump = exp( -2.0 * fract( 10.0 * hnoise.z * ( 1.0 * hnoise.x + uv.x ) ) );
  signal += 4.0 * pow(
    ( 0.5 + 0.5 * hnoise.y ) * bump,
    mix( 20.0, 8.0, linearstep( 0.0, 0.01, abs( offsyncAmp ) ) )
  );

  fragColor = vec4( signal, 0.0, 0.0, 1.0 );
}