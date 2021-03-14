#version 300 es

precision highp float;

const vec3 RGB = vec3( 0.299, 0.587, 0.114 );

in vec2 vUv;

layout (location = 0) out vec4 fragColor;
layout (location = 1) out vec4 fragClamp;

uniform float threshold;
uniform float mul;
uniform vec2 resolution;
uniform sampler2D sampler0;
uniform sampler2D sampler1;

vec2 getValue( vec2 uv ) {
  return ( ( uv.x < 0.0 ) || ( 1.0 < uv.x ) )
    ? vec2( 0.0 )
    : ( mul == 1.0 )
      ? vec2( 1E9 * step( dot( texture( sampler0, uv ).xyz, RGB ), threshold ) )
      : texture( sampler1, uv ).xy;
}

void main() {
  vec2 uv = vUv;

  fragColor = vec4( texture( sampler0, uv ).xyz, 1.0 );
  fragClamp = vec4( getValue( uv ), 0.0, 1.0 );

  for ( int i = 1; i < 8; i ++ ) {
    vec2 uvc = uv - vec2( i, 0 ) / resolution * mul;
    vec2 texc = getValue( uvc );
    fragClamp.xy = min( fragClamp.xy, texc + mul * float( i ) );
  }
}
