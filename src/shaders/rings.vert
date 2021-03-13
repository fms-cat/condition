#version 300 es

const float TAU = 6.283185307;

in float instanceId;
in vec3 position;
in vec3 normal;
in vec2 uv;

out vec4 vPosition;
out vec3 vNormal;
out vec2 vUv;

uniform float time;
uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

float seed;

mat2 rotate2D( float t ) {
  return mat2( cos( t ), sin( t ), -sin( t ), cos( t ) );
}

float fs( float s ) {
  return fract( sin( s * 114.514 ) * 1919.810 );
}

float random() {
  seed = fs( seed );
  return seed;
}

void main() {
  seed = instanceId;

  vNormal = normalize( ( normalMatrix * vec4( normal, 1.0 ) ).xyz );

  vPosition = vec4( mix( 2.0, 2.7, random() ) * position, 1.0 );
  vPosition.xyz += mix( 0.002, 0.005, random() ) * normal;
  vPosition.y += sin( random() * time + random() * vPosition.x + TAU * random() ) * 0.2 * random();
  vPosition.y += sin( random() * time + random() * vPosition.z + TAU * random() ) * 0.2 * random();
  vPosition.xy = rotate2D( 0.2 * ( random() - 0.5 ) ) * vPosition.xy;
  vPosition.yz = rotate2D( 0.2 * ( random() - 0.5 ) ) * vPosition.yz;
  vPosition = modelMatrix * vPosition;

  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;

  vUv = uv;
}
