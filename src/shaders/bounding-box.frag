#version 300 es

precision highp float;

#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

in vec4 vPositionWithoutModel;
in vec4 vPosition;

#ifdef FORWARD
  out vec4 fragColor;
#endif

#ifdef SHADOW
  out vec4 fragColor;

  uniform vec2 cameraNearFar;
  uniform vec3 cameraPos;
#endif

uniform float time;

void main() {
  float phase = vPositionWithoutModel.x + vPositionWithoutModel.y + vPositionWithoutModel.z;
  float pattern = sin( phase * 40.0 + 10.0 * time );

  if ( pattern < 0.0 ) {
    discard;
  }

  #ifdef FORWARD
    fragColor = vec4( 1.0 );
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
