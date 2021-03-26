#version 300 es

layout (location = 0) in vec3 position;

uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

// ------

void main() {
  vec4 outPos = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 );

  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;
}
