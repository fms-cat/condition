#version 300 es

precision highp float;

in vec3 vNormal;
in vec3 vPositionForNoise;
in vec4 vPosition;

#ifdef DEFERRED
  layout (location = 0) out vec4 fragPosition;
  layout (location = 1) out vec4 fragNormal;
  layout (location = 2) out vec4 fragColor;
  layout (location = 3) out vec4 fragWTF;
#endif

uniform float time;

#pragma glslify: cyclicNoise = require( ./modules/cyclicNoise );

void main() {
  float roughness = 0.6 + 0.1 * cyclicNoise( 1.0 * vPositionForNoise.xyz ).x;

  #ifdef DEFERRED
    fragPosition = vPosition;
    fragNormal = vec4( normalize( vNormal ), 1.0 );
    fragColor = vec4( vec3( 0.1, 0.1, 0.12 ), 1.0 );
    fragWTF = vec4( vec3( roughness, 0.77, 0.0 ), 2 );
  #endif
}
