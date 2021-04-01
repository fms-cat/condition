#version 300 es

#define fs(i) (fract(sin((i)*114.514)*1919.810))

const float PI = 3.14159265;
const float TAU = 6.28318531;

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in float instanceId;

out vec3 vNormal;
out vec4 vPositionWithoutModel;
out vec4 vPosition;

uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

mat2 rotate2D( float t ) {
  return mat2( cos( t ), sin( t ), -sin( t ), cos( t ) );
}

void main() {
  mat2 rot = rotate2D( 0.25 * instanceId * TAU );

  vNormal = normal;
  vNormal.zx = rot * vNormal.zx;
  vNormal = normalize( ( normalMatrix * vec4( vNormal, 1.0 ) ).xyz );

  vPositionWithoutModel = vec4( vec3( 3.1, 0.1, 0.1 ) * position + vec3( 0.0, 0.0, 3.0 ), 1.0 );
  vPositionWithoutModel.zx = rot * vPositionWithoutModel.zx;

  vPosition = modelMatrix * vPositionWithoutModel;

  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
