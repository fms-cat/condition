#version 300 es

#define fs(i) (fract(sin((i)*114.514)*1919.810))

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec3 instancePos;

out vec3 vNormal;
out vec3 vPositionForNoise;
out vec4 vPosition;

uniform float phase;
uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

#pragma glslify: noise = require( ./-simplex4d );

void main() {
  vNormal = normalize( ( normalMatrix * vec4( normal, 1.0 ) ).xyz );

  float good = clamp(
    0.5 + noise( vec4( 0.3 * instancePos, phase ) ),
    0.0,
    1.0
  );
  vPosition = vec4( good * position / 8.0, 1.0 );
  vPosition.xyz += mix( vec3( -1.0 ), vec3( 1.0 ), instancePos / 7.0 );
  vPosition = modelMatrix * vPosition;

  vPositionForNoise = position + 2.0 * instancePos;

  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
