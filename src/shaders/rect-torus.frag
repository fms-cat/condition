#version 300 es

#define lofi(i,m) (floor((i)/(m))*(m))

precision highp float;

const int MTL_PBR = 2;

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

#pragma glslify: cyclicNoise = require( ./modules/cyclicNoise );

void main() {
  float rough = 0.2 + 0.2 * cyclicNoise( 4.0 * vPositionWithoutModel.xyz ).x;

  #ifdef DEFERRED
    fragPosition = vPosition;
    fragNormal = vec4( normalize( vNormal ), 1.0 );
    fragColor = vec4( vec3( 0.1 ), 1.0 );
    fragWTF = vec4( vec3( 0.2 + 0.5 * rough, 0.9, 0.0 ), MTL_PBR );
  #endif
}
