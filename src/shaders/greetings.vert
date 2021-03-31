#version 300 es

#define fs(i) (fract(sin((i)*114.514)*1919.810))
#define saturate(i) clamp(i,0.,1.)

// -------------------------------------------------------------------------------------------------

layout (location = 0) in vec2 position;
layout (location = 1) in vec4 charParams;
layout (location = 2) in vec4 charParams2;

out float vTime;
out vec2 vUv;
out vec4 vCharParams;
out vec4 vPosition;

uniform float time;
uniform vec2 resolution;

// == utils ========================================================================================
vec2 yflip( vec2 uv ) {
  return vec2( 0.0, 1.0 ) + vec2( 1.0, -1.0 ) * uv;
}

// == main procedure ===============================================================================
void main() {
  vCharParams = charParams;

  float char = vCharParams.x;

  vUv = yflip( 0.5 + 0.499 * position );
  vUv = ( vUv + floor( mod( vec2( char / vec2( 1.0, 16.0 ) ), 16.0 ) ) ) / 16.0;

  vTime = time - vCharParams.w;

  // == compute size ===============================================================================
  vPosition = vec4( 0.0, 0.0, 0.0, 1.0 );

  vec2 shape = 0.5 * position;
  shape.y *= charParams2.y;

  vec2 offset = ( 0.6 - 0.2 * exp( -5.0 * vTime ) ) * vec2( vCharParams.y, 0.0 );
  vPosition.xy += ( offset + shape ) * min( 500.0 / charParams2.x, 1.0 );

  vPosition.xy += 1.0
    * ( fs( vCharParams.z + vec2( 2.66, 1.79 ) ) * 2.0 - 1.0 )
    * pow( fs( vCharParams.z + 7.8 ), 2.0 );

  // == send the vertex position ===================================================================
  vPosition = vPosition;
  vec4 outPos = vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
