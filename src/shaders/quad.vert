#version 300 es

layout (location = 0) in vec2 p;

out vec2 vUv;

uniform vec4 range;

void main() {
  vUv = 0.5 + 0.5 * p;
  gl_Position = vec4( mix( range.xy, range.zw, vUv ), 0.0, 1.0 );
}
