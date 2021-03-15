#version 300 es

precision highp float;

const int MTL_PBR = 2;

in float vLife;
in vec4 vPosition;
in vec3 vNormal;

layout (location = 0) out vec4 fragPosition;
layout (location = 1) out vec4 fragNormal;
layout (location = 2) out vec4 fragColor;
layout (location = 3) out vec4 fragWTF;

uniform float time;

void main() {
  fragPosition = vPosition;
  fragNormal = vec4( normalize( vNormal ), 1.0 );
  fragColor = vec4( 0.2, 0.9, 0.5, 1.0 );
  fragWTF = vec4( vec3( 0.2, 0.2, 4.0 ), MTL_PBR );
}
