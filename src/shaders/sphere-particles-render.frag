#version 300 es

precision highp float;

const int MTL_UNLIT = 1;
const int MTL_PBR = 2;
const int MTL_IRIDESCENT = 4;

const float PI = 3.14159265;
const float TAU = 6.28318531;

#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

// == varings / uniforms ===========================================================================
in float vLife;
in vec4 vPosition;
in vec3 vNormal;
in vec4 vColor;
in vec4 vRandom;

#ifdef DEFERRED
  layout (location = 0) out vec4 fragPosition;
  layout (location = 1) out vec4 fragNormal;
  layout (location = 2) out vec4 fragColor;
  layout (location = 3) out vec4 fragWTF;
#endif

uniform float time;

// == common =======================================================================================
mat2 rotate2D( float _t ) {
  return mat2( cos( _t ), sin( _t ), -sin( _t ), cos( _t ) );
}

// == main procedure ===============================================================================
void main() {
  if ( vColor.a < 0.0 ) { discard; }

  #ifdef DEFERRED
    fragPosition = vPosition;
    fragNormal = vec4( vNormal, 1.0 );
    fragColor = vec4( vColor.xyz, 1.0 );
    fragWTF = vec4( vec3( 0.1, 0.2, 0.0 ), MTL_PBR );
  #endif
}
