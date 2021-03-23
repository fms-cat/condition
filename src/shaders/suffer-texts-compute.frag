#version 300 es

precision highp float;

out vec4 fragCompute0;

uniform float time;
uniform float deltaTime;
uniform vec2 resolution;
uniform vec4 logInit;
uniform sampler2D samplerCompute0;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;

  fragCompute0 = texture( samplerCompute0, uv );

  if ( logInit.w == uv.x ) {
    fragCompute0 = logInit;
    fragCompute0.w = 0.0; // life
  }

  fragCompute0.w += deltaTime; // life
}
