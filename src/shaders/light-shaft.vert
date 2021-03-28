#version 300 es

const float PI = 3.14159265;

layout (location = 0) in vec3 position;

out float vFrustumZ;
out vec4 vPosition;

uniform float lightFov;
uniform vec2 lightNearFar;
uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

// ------

void main() {
  float vFrustumZ = 0.5 + 0.5 * position.z;

  vec3 pos = mix(
    vec3( position.xy * lightNearFar.x * tan( lightFov / 360.0 * PI ), -lightNearFar.x ),
    vec3( position.xy * lightNearFar.y * tan( lightFov / 360.0 * PI ), -lightNearFar.y ),
    vFrustumZ
  );

  vPosition = modelMatrix * vec4( pos, 1.0 );
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;

  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;
}
