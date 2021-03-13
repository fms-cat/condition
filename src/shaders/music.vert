#version 300 es

precision highp float;

const float PI = 3.14159265359;
const float TAU = 6.28318530718;

uniform float bpm;
uniform float sampleRate;
uniform float _deltaSample;
uniform vec4 timeLength;
uniform vec4 _timeHead;

in float off;

out float outL;
out float outR;

float kick( float t ) {
  if ( t < 0.0 ) { return 0.0; }

  float attack = 4.0;

  return exp( -4.0 * t ) * sin( TAU * (
    50.0 * t - attack * ( exp( -40.0 * t ) + exp( -10.0 * t ) )
  ) );
}

vec2 mainAudio( vec4 time ) {
  vec2 dest = vec2( 0.0 );

  float tKick = time.x; // time.x = a beat
  float aKick = kick( tKick );
  dest += 0.0 * aKick;

  return dest;
}

void main() {
  vec2 out2 = mainAudio( mod( _timeHead + off * _deltaSample, timeLength ) );
  outL = out2.x;
  outR = out2.y;
}




