#version 300 es

layout (location = 0) in vec3 position;

out vec4 vPositionWithoutModel;
out vec4 vPosition;

uniform float time;
uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

#pragma glslify: cyclicNoise = require( ./modules/cyclicNoise );

void main() {
  vPositionWithoutModel = vec4( position, 1.0 );

  float n = 0.5 + 0.5 * cyclicNoise( 2.0 * vPositionWithoutModel.xyz - vec3( 0.0, time, 0.0 ) ).x;
  vPositionWithoutModel.z += 1.0 * n * exp( -2.0 * length( vPositionWithoutModel.xy ) );

  vPosition = modelMatrix * vPositionWithoutModel;

  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
