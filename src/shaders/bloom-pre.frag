#version 300 es

precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D sampler0;

void main() {
  fragColor = vec4(
    max( vec3( 0.0 ), ( texture( sampler0, vUv ).xyz - 1.0 ) * 1.0 ),
    1.0
  );
}
