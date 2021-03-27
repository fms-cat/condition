#version 300 es

const float TAU = 6.283185307;

layout (location = 0) in vec2 what;
layout (location = 1) in vec4 huh;

out float vPhase;
out vec3 vNormal;
out vec4 vPosition;
out vec4 vHuh;

uniform float time;
uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;
uniform sampler2D samplerSvg;

#pragma glslify: orthBasis = require( ./modules/orthBasis );

void main() {
  vPhase = what.x;
  vHuh = huh;

  vec4 tex = texture( samplerSvg, vec2( what.x, huh.x ) );

  vPosition = vec4( tex.xy + vec2( huh.y, 0.0 ), 60.0 - 120.0 * huh.z, 1.0 );

  mat3 basis = orthBasis( vec3( tex.zw, 0.0 ) );
  float theta = what.y / 3.0 * TAU;
  vec3 tube = 0.2 * basis * vec3( sin( theta ), cos( theta ), 0.0 );
  vNormal = ( normalMatrix * vec4( tube, 1.0 ) ).xyz;

  vPosition.xyz += tube;

  vPosition = modelMatrix * vPosition;

  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
