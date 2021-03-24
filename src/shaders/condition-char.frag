#version 300 es

precision highp float;

const int MTL_UNLIT = 1;

#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

in float vPhase;
in vec3 vNormal;
in vec4 vPosition;

#ifdef FORWARD
  out vec4 fragColor;
#endif

#ifdef DEFERRED
  layout (location = 0) out vec4 fragPosition;
  layout (location = 1) out vec4 fragNormal;
  layout (location = 2) out vec4 fragColor;
  layout (location = 3) out vec4 fragWTF;
#endif

#ifdef SHADOW
  out vec4 fragColor;

  uniform vec2 cameraNearFar;
  uniform vec3 cameraPos;
#endif

uniform float time;
uniform float svgi;
uniform float phaseOffset;
uniform float phaseWidth;

void main() {
  float phase = fract( 2.0 * vPhase + 0.1 * time + 0.1 * svgi + phaseOffset );
  if ( phase > phaseWidth ) { discard; }

  #ifdef FORWARD
    fragColor = vec4( 1.0 );
  #endif

  #ifdef DEFERRED
    fragPosition = vPosition;
    fragNormal = vec4( vNormal, 1.0 );
    fragColor = vec4( 1.0 );
    fragWTF = vec4( vec3( 0.0, 0.0, 0.0 ), MTL_UNLIT );
  #endif

  #ifdef SHADOW
    float depth = linearstep(
      cameraNearFar.x,
      cameraNearFar.y,
      length( cameraPos - vPosition.xyz )
    );
    fragColor = vec4( depth, depth * depth, depth, 1.0 );
  #endif
}
