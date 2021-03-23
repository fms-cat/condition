#version 300 es

precision highp float;

const int MTL_UNLIT = 1;

// == varings / uniforms ===========================================================================
in float vLife;
in float vMode;
in vec2 vUv;
in vec2 vSize;
in vec3 vNormal;
in vec4 vPosition;
in vec4 vDice;

uniform float time;
uniform sampler2D samplerRandomStatic;
uniform sampler2D samplerTinyChar;

#ifdef DEFERRED
  layout (location = 0) out vec4 fragPosition;
  layout (location = 1) out vec4 fragNormal;
  layout (location = 2) out vec4 fragColor;
  layout (location = 3) out vec4 fragWTF;
#endif

// == main procedure ===============================================================================
void main() {
  if ( vLife > 1.0 ) { discard; }

  float tex = texture( samplerTinyChar, vUv ).x;
  if ( tex < 0.5 ) { discard; }

  #ifdef DEFERRED
    fragPosition = vPosition;
    fragNormal = vec4( vNormal, 1.0 );
    fragColor = vec4( 1.0 );
    fragWTF = vec4( vec3( 0.0 ), MTL_UNLIT );
  #endif
}
