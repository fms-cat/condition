#version 300 es

precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D sampler0;

void main() {
  fragColor = step( 0.9, texture( sampler0, vUv ) );
}
