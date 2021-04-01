#version 300 es

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;

out vec3 vNormal;
out vec4 vPosition;
out vec4 vPositionWithoutModel;

uniform float time;
uniform float distort;
uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

#pragma glslify: cyclicNoise = require( ./modules/cyclicNoise );

void main() {
  vNormal = normalize( ( normalMatrix * vec4( normal, 1.0 ) ).xyz );

  vPositionWithoutModel = vec4( position, 1.0 );
  vPosition = modelMatrix * vPositionWithoutModel;
  vPosition.xyz -= distort * cyclicNoise( 0.3 * vPosition.xyz + 0.3 * time );
  vNormal = normalize( vNormal + distort * cyclicNoise( 1.0 + 0.3 * vPosition.xyz + 0.3 * time ) );

  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
