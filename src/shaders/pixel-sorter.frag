#version 300 es

precision highp float;

#define lofi(i,m) (floor((i)/(m))*(m))

const vec3 RGB = vec3( 0.299, 0.587, 0.114 );

in vec2 vUv;

out vec4 fragColor;

uniform bool reverse;
uniform float dir;
uniform float comp;
uniform vec2 resolution;
uniform sampler2D sampler0;
uniform sampler2D sampler1;

float positiveOrHuge( float i ) {
  return 0.0 < i ? i : 1E9;
}

// not accurate! it's just for aesthetics
void main() {
  vec2 uv = vUv;

  fragColor = texture( sampler0, uv );
  vec4 texIndex = texture( sampler1, uv );

  if ( texIndex.x < 0.5 ) {
    return;
  }

  float index = ( reverse ? texIndex.y : texIndex.x ) - 1.0;
  float width = texIndex.x + texIndex.y - 1.0;

  bool isCompHigher = mod( index, 2.0 * comp * width ) < comp * width;
  float offset = floor( ( ( isCompHigher ^^ reverse ) ? comp : -comp ) * width + 0.5 );

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
  shouldSwap = shouldSwap ^^ isCompHigher;
  shouldSwap = shouldSwap ^^ ( vc < vp );
  if ( shouldSwap ) {
    fragColor = cColor;
  }
}
