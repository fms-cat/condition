#version 300 es

precision highp float;

const int BARREL_ITER = 10;
const float BARREL_OFFSET = 0.05;
const float BARREL_AMP = 0.05;
const float HUGE = 9E16;
const float PI = 3.14159265;
const vec3 LUMA = vec3( 0.2126, 0.7152, 0.0722 );

#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))

in vec2 vUv;

out vec4 fragColor;

uniform float time;
uniform float mosaicAmp;
uniform float mixInvert;
uniform vec2 resolution;
uniform vec4 colorLift;
uniform vec4 colorGamma;
uniform vec4 colorGain;
uniform sampler2D sampler0;
uniform sampler2D samplerRandom;

#pragma glslify: prng = require( ./-prng );

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

vec3 aces( vec3 x ) {
  return saturate( ( x * ( 0.45 * x + 0.02 ) ) / ( x * ( 0.45 * x + 0.07 ) + 0.2 ) );
}

vec3 liftGammaGain( vec3 rgb ) {
  vec4 liftt = 1.0 - pow( 1.0 - colorLift, log2( colorGain + 1.0 ) );

  vec4 gammat = colorGamma.rgba - vec4( 0.0, 0.0, 0.0, dot( LUMA, colorGamma.rgb ) );
  vec4 gammatTemp = 1.0 + 4.0 * abs( gammat );
  gammat = mix( gammatTemp, 1.0 / gammatTemp, step( 0.0, gammat ) );

  vec3 col = rgb;
  float luma = dot( LUMA, col );

  col = pow( col, gammat.rgb );
  col *= pow( colorGain.rgb, gammat.rgb );
  col = max( mix( 2.0 * liftt.rgb, vec3( 1.0 ), col ), 0.0 );

  luma = pow( luma, gammat.a );
  luma *= pow( colorGain.a, gammat.a );
  luma = max( mix( 2.0 * liftt.a, 1.0, luma ), 0.0 );

  col += luma - dot( LUMA, col );

  return saturate( col );
}

void main() {
  vec2 uv = vUv;

  float mosaic = mosaicAmp * resolution.y;
  if ( mosaic > 1.0 ) {
    uv = lofi( uv - 0.5, mosaic / resolution ) + mosaic * 0.5 / resolution + 0.5;
  }

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

  vec3 col = tex.xyz;
  vec4 seed = texture( samplerRandom, uv );
  prng( seed );
  prng( seed );
  col = aces( max( 2.0 * col, 0.0 ) ) / aces( vec3( 11.2 ) );
  col += ( pow( prng( seed ), 2.2 ) - 0.25 ) * 0.002;
  col = pow( saturate( col ), vec3( 0.4545 ) );
  col = mix( col, 1.0 - 1.0 * col, mixInvert );
  col = liftGammaGain( col );

  fragColor = vec4( col, 1.0 );
}
