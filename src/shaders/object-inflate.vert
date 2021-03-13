#version 300 es

in vec3 position;
in vec3 normal;
in vec2 uv;

out vec4 vPosition;
out vec3 vNormal;
out vec2 vUv;

#ifdef USE_VERTEX_COLOR
  in vec4 color;
  out vec4 vColor;
#endif

uniform float inflate;
uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

// ------

void main() {
  vNormal = normalize( ( normalMatrix * vec4( normal, 1.0 ) ).xyz );

  vPosition = modelMatrix * vec4( position + inflate * normal, 1.0 );
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;

#ifdef USE_VERTEX_COLOR
  vColor = color;
#endif

  vUv = uv;
}
