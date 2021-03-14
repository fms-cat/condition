#version 300 es

precision highp float;

#define lofi(i,m) (floor((i)/(m))*(m))

const vec3 RGB = vec3( 0.299, 0.587, 0.114 );

in vec2 vUv;

layout (location = 0) out vec4 fragColor;
layout (location = 1) out vec4 fragClamp;

uniform float dir;
uniform float comp;
uniform vec2 resolution;
uniform sampler2D sampler0;
uniform sampler2D sampler1;

float positiveOrHuge( float i ) {
  return 0.0 < i ? i : 1E9;
}

void main() {
  vec2 uv = vUv;

  fragColor = texture( sampler0, uv );
  fragClamp = texture( sampler1, uv );

  if ( fragClamp.x < 0.5 ) {
    return;
  }

  float index = fragClamp.x - 1.0;
  float width = fragClamp.x + fragClamp.y - 1.0;

  bool isCompRight = mod( index, 2.0 * comp * width ) < comp * width;
  float offset = floor( ( isCompRight ? comp : -comp ) * width + 0.5 );

  vec2 uvc = uv;
  uvc.x += offset / resolution.x;
  vec4 cColor = texture( sampler0, uvc );
  vec4 cClamp = texture( sampler1, uvc );

  if ( uvc.x < 0.0 || 1.0 < uvc.x ) {
    return;
  }

  float vp = dot( fragColor.xyz, RGB );
  float vc = dot( cColor.xyz, RGB );

  bool shouldSwap = mod( index / ( 2.0 * dir * width ), 2.0 ) < 1.0;
  shouldSwap = shouldSwap ^^ isCompRight;
  shouldSwap = shouldSwap ^^ ( vc < vp );
  if ( shouldSwap ) {
    fragColor = cColor;
  }
}
