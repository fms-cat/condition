#version 300 es

precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D sampler0;

void main() {
  vec3 tex = texture( sampler0, vUv ).xyz;
  float brightness = dot( tex, vec3( 0.299, 0.587, 0.114 ) );
  vec3 normalized = brightness < 0.01 ? vec3( brightness ) : tex / brightness;

  fragColor = vec4(
    max( 0.0, brightness - 1.0 ) * normalized,
    1.0
  );
}
