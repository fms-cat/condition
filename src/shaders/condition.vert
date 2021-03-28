#version 300 es

#define fs(i) (fract(sin((i)*114.514)*1919.810))

const float TAU = 6.283185307;

layout (location = 0) in vec2 what;
layout (location = 1) in vec4 huh;

out float vPhase;
out float vScale;
out float vFade;
out vec3 vNormal;
out vec4 vPosition;
out vec4 vHuh;

uniform float time;
uniform float hahaRatio;
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

  vec3 randomPos = fs( vec3( 5.0, 8.6, 1.9 ) + huh.z + 2.56 * huh.y ) - 0.5;
  randomPos.z = mod( randomPos.z + 0.1 * time, 1.0 ) - 0.5;
  randomPos *= vec3( 5.0, 5.0, 20.0 );

  vFade = smoothstep( 9.0, 10.0, abs( randomPos.z ) );

  float haha = hahaRatio * smoothstep( 1.0, 2.0, randomPos.z );

  vec4 tex = texture( samplerSvg, vec2( what.x, huh.x ) );

  vPosition = vec4( tex.xy, 0.0, 1.0 );

  mat3 basis = orthBasis( vec3( tex.zw, 0.0 ) );
  float theta = what.y / 3.0 * TAU;
  vec3 tube = 0.1 * basis * vec3( sin( theta ), cos( theta ), 0.0 );
  vNormal = ( normalMatrix * vec4( tube, 1.0 ) ).xyz;

  vScale = exp( 2.0 * fs( huh.z + 2.56 * huh.y ) );
  vPosition.xyz *= mix( vScale, 1.0, haha );

  vPosition.x += mix( 0.0, huh.y, haha );

  vPosition.xyz += tube;

  vPosition = modelMatrix * vPosition;

  vPosition.xyz += mix( randomPos, vec3( 0.0, 0.0, 3.0 ), haha );

  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
