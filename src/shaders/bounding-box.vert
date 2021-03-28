#version 300 es

layout (location = 0) in vec3 position;

out vec4 vPositionWithoutModel;
out vec4 vPosition;

uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

void main() {
  vPositionWithoutModel = vec4( position, 1.0 );
  vPosition = modelMatrix * vPositionWithoutModel;

  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
