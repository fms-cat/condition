#version 300 es

precision highp float;

const int MTL_PBR = 2;

in float vLife;
in vec3 vNormal;
in vec4 vPosition;
in vec4 vPositionShaft;

#ifdef FORWARD
  out vec4 fragColor;
#endif

#ifdef DEFERRED
  layout (location = 0) out vec4 fragPosition;
  layout (location = 1) out vec4 fragNormal;
  layout (location = 2) out vec4 fragColor;
  layout (location = 3) out vec4 fragWTF;
#endif

#ifdef DEPTH
  out vec4 fragColor;
#endif

uniform float time;
uniform vec2 cameraNearFar;
uniform vec3 cameraPos;

#pragma glslify: cyclicNoise = require( ./modules/cyclicNoise );

void main() {
  vec3 noisep = vNormal.xyz + 4.0 * time + atan( vPositionShaft.x, vPositionShaft.z );
  float noise = cyclicNoise( 4.0 * noisep ).x;

  if ( noise < 0.0 ) { discard; }

  #ifdef FORWARD
    fragColor = vec4( 8.0 * vec3( 0.1, 0.4, 1.0 ), 1.0 );
  #endif

  #ifdef DEFERRED
    fragPosition = vPosition;
    fragNormal = vec4( normalize( vNormal ), 1.0 );
    fragColor = vec4( vec3( 0.5 ), 1.0 );
    fragWTF = vec4( vec3( 0.99, 0.01, 0.0 ), MTL_PBR );
  #endif

  #ifdef DEPTH
    float depth = linearstep(
      cameraNearFar.x,
      cameraNearFar.y,
      length( cameraPos - vPosition.xyz )
    );
    fragColor = vec4( depth, depth * depth, depth, 1.0 );
  #endif
}
