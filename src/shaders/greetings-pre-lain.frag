#version 300 es

precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D sampler0;

#pragma glslify: cyclicNoise = require( ./modules/cyclicNoise );

void main() {
  vec2 uv = vUv;
  uv += 0.001 * sin( 20.0 * cyclicNoise( vec3( 4.0 * uv, 1.0 ) ).xy );

  fragColor = texture( sampler0, uv );
}
