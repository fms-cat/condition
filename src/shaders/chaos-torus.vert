#version 300 es

const float TAU = 6.283185307;

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;

out vec4 vPositionShaft;
out vec4 vPosition;
out vec3 vNormal;

uniform float time;
uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

#pragma glslify: cyclicNoise = require( ./modules/cyclicNoise );

mat2 rotate2D( float t ) {
  return mat2( cos( t ), sin( t ), -sin( t ), cos( t ) );
}

void main() {
  vNormal = normalize( ( normalMatrix * vec4( normal, 1.0 ) ).xyz );

  vPosition = vPositionShaft = vec4( 3.0 * position, 1.0 );
  vPosition.xyz += 0.3 * normal;

  vec3 noisep = vNormal.xyz + time + atan( vPositionShaft.x, vPositionShaft.z );
  vPosition.xyz += 0.5 * cyclicNoise( noisep + 3.0 );

  vPosition = modelMatrix * vPosition;

  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
