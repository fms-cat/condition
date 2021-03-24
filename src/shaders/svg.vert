#version 300 es

const float TAU = 6.283185307;

in vec2 what;

out float vPhase;
out vec3 vNormal;
out vec4 vPosition;

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
  vec4 tex = texture( samplerSvg, vec2( what.x, 0.5 ) );

  vPosition = vec4( tex.xy, 0.0, 1.0 );

  mat3 basis = orthBasis( vec3( tex.zw, 0.0 ) );
  float theta = what.y / 3.0 * TAU;
  vec3 tube = 0.2 * basis * vec3( sin( theta ), cos( theta ), 0.0 );
  vNormal = ( normalMatrix * vec4( tube, 1.0 ) ).xyz;

  vPosition.xyz += tube;

  vec4 outPos = projectionMatrix * viewMatrix * modelMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
