#version 300 es

precision highp float;

const float TAU = 6.283185307;

in float vInstanceId;
in vec3 vNormal;
in vec4 vPosition;
in vec4 vPositionWithoutModel;

#ifdef DEFERRED
  layout (location = 0) out vec4 fragPosition;
  layout (location = 1) out vec4 fragNormal;
  layout (location = 2) out vec4 fragColor;
  layout (location = 3) out vec4 fragWTF;
#endif

uniform float time;

#pragma glslify: orthBasis = require( ./modules/orthBasis );
#pragma glslify: cyclicNoise = require( ./modules/cyclicNoise );

void main() {
  float roughness = 0.3 + 0.1 * cyclicNoise( 4.0 * vPositionWithoutModel.xyz ).x;

  #ifdef DEFERRED
    fragPosition = vPosition;
    fragNormal = vec4( vNormal, 1.0 );
    fragColor = vec4( vec3( 0.2 ), 1.0 );
    fragWTF = vec4( roughness, 0.9, 0.0, 2 );
  #endif
}
