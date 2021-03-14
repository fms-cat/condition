#version 300 es

precision highp float;

const int MTL_PBR = 2;

in float vLife;
in vec3 vNormal;
in vec4 vPosition;
in vec4 vPositionWithoutModel;

layout (location = 0) out vec4 fragPosition;
layout (location = 1) out vec4 fragNormal;
layout (location = 2) out vec4 fragColor;
layout (location = 3) out vec4 fragWTF;

#pragma glslify: noise = require( ./-simplex4d );

uniform float time;

float fbm( vec4 p ) {
  float v = 0.5 * noise( 1.0 * p );
  v += 0.25 * noise( 2.0 * p );
  v += 0.125 * noise( 4.0 * p );
  v += 0.0625 * noise( 8.0 * p );
  return v;
}

void main() {
  float rough = smoothstep( -0.6, 0.6, fbm( vPositionWithoutModel ) );
  // vec3 ndisp = rough * 0.2 * vec3(
  //   fbm( 1.577 + 4.0 * vPosition ),
  //   fbm( 12.577 + 4.0 * vPosition ),
  //   fbm( 27.577 + 4.0 * vPosition )
  // );

  fragPosition = vPosition;
  fragNormal = vec4( normalize( vNormal ), 1.0 );
  fragColor = vec4( vec3( 0.5 - 0.3 * rough ), 1.0 );
  fragWTF = vec4( vec3( 0.3 + 0.2 * rough, 0.9, 0.0 ), MTL_PBR );
}
