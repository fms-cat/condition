#version 300 es

#define lofi(i,m) (floor((i)/(m))*(m))

precision highp float;

const int MTL_PBR = 2;

in float vLife;
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

vec3 cyclicNoise( vec3 p ) {
  vec3 sum = vec3( 0.0 );
  float amp = 0.5;

  for ( int i = 0; i < 8; i ++ ) {
    p = p.zxy * 1.4 + 0.5;
    vec3 pt = lofi( p, 0.5 );
    sum += sin( cross( cos( pt ), sin( pt.yzx ) ) ) * amp;
    p += sum;
    amp *= 0.5;
  }

  return sum;
}

void main() {
  float rough = 0.5 + 0.5 * sin( 34.0 * cyclicNoise( vPositionWithoutModel.xyz ).x );

  #ifdef DEFERRED
    fragPosition = vPosition;
    fragNormal = vec4( normalize( vNormal ), 1.0 );
    fragColor = vec4( vec3( 0.1 ), 1.0 );
    fragWTF = vec4( vec3( 0.2 + 0.5 * rough, 0.77, 0.0 ), MTL_PBR );
  #endif
}
