#version 300 es

const float PI = 3.14159265;
const float TAU = 6.283185307;
const float COLOR_VAR = 0.1;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

layout (location = 0) in vec2 computeUV;

out float vLife;
out vec4 vPosition;

uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform sampler2D samplerCompute0;
uniform sampler2D samplerCompute1;

mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

void main() {
  vec2 uv = computeUV;

  vec4 pos = texture( samplerCompute0, uv );

  vLife = pos.w;

  vPosition = modelMatrix * vec4( pos.xyz, 1.0 );
  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;

  #ifdef CUBEMAP
    // ????
    gl_PointSize = 2.0;
  #else
    gl_PointSize = resolution.y * 0.01 / outPos.z;
  #endif
}
