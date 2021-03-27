#version 300 es

#define fs(i) (fract(sin((i)*114.514)*1919.810))

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in float instanceId;

out float vInstanceId;
out vec3 vNormal;
out vec4 vPositionWithoutModel;
out vec4 vPosition;

uniform float clap;
uniform vec2 resolution;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;

void main() {
  vInstanceId = instanceId;

  vNormal = normalize( ( normalMatrix * vec4( normal, 1.0 ) ).xyz );

  vPositionWithoutModel = vec4( position, 1.0 );

  vec3 clapScale = fs( vec3( 14.0, 5.2, 8.7 ) + 100.0 * instanceId );
  vPositionWithoutModel.xyz *= clapScale;

  vPosition = vPositionWithoutModel;

  vec3 clapPositionSeed = vec3( 5.0, 8.6, 1.9 ) + 100.0 * instanceId;
  vec3 clapPosition = 2.0 - 4.0 * mix(
    fs( clapPositionSeed + floor( clap ) ),
    fs( clapPositionSeed + floor( clap + 1.0 ) ),
    fract( clap )
  );
  vPosition.xyz += clapPosition;

  vPosition = modelMatrix * vPosition;

  vec4 outPos = projectionMatrix * viewMatrix * vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
