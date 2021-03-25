#version 300 es

precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D sampler0;

void main() {
  fragColor = texture( sampler0, vUv );
}
