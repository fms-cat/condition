#version 300 es

in vec3 position;
in vec3 normal;
in vec2 uv;

out vec4 vPositionWithoutModel;
out vec4 vPosition;
out vec3 vNormal;
out vec2 vUv;

uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

// ------

void main() {
  vNormal = normalize( ( normalMatrix * vec4( normal, 1.0 ) ).xyz );

  vPositionWithoutModel = vec4( position, 1.0 );
  vPosition = modelMatrix * vPositionWithoutModel;
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;

  vUv = uv;
}
