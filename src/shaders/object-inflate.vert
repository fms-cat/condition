#version 300 es

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;

out vec4 vPosition;
out vec3 vNormal;

uniform float inflate;
uniform vec3 scale;
uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

// ------

void main() {
  vNormal = normalize( ( normalMatrix * vec4( normal, 1.0 ) ).xyz );

  vPosition = modelMatrix * vec4( scale * position + inflate * normal, 1.0 );
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;

  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;
}
