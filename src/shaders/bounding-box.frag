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
#endif

uniform float time;
uniform vec2 cameraNearFar;
uniform vec3 cameraPos;

void main() {
  float phase = vPositionWithoutModel.x + vPositionWithoutModel.y + vPositionWithoutModel.z;
  float pattern = sin( phase * 40.0 + 10.0 * time );

  if ( pattern < 0.0 ) {
    discard;
  }

  #ifdef FORWARD
    vec3 color = vec3( 1.0 );

    float lenV = length( cameraPos - vPosition.xyz );
    color *= exp( -0.4 * max( lenV - 3.0, 0.0 ) );

    fragColor = vec4( color, 1.0 );
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
