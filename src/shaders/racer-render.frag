#version 300 es

precision highp float;

in float vLife;
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

uniform vec3 cameraPos;
uniform vec4 color;

void main() {
  if ( length( gl_PointCoord - 0.5 ) > 0.5 ) { discard; }

  float lenV = length( vPosition.xyz - cameraPos );

  vec3 gradient = 0.5 + 0.5 * cos(
    3.0 + 1.5 * exp( -0.4 * max( lenV - 3.0, 0.0 ) ) + vec3( 0.0, 2.0, 4.0 )
  );

  vec3 color = 10.0 * gradient * exp( -5.0 * vLife );

  // too near!
  color *= smoothstep( 0.5, 1.0, lenV );

  #ifdef FORWARD
    #ifndef CUBEMAP
      if ( length( color.xyz ) >= 1.0 ) { discard; }
    #endif

    // decay
    color *= exp( -0.4 * max( lenV - 3.0, 0.0 ) );

    fragColor.xyz = vec3( color );
  #endif

  #ifdef DEFERRED
    if ( length( color.xyz ) < 1.0 ) { discard; }

    fragPosition = vPosition;
    fragNormal = vec4( 0.0, 0.0, 1.0, 1.0 );
    fragColor = vec4( color.xyz, 1.0 );
    fragWTF = vec4( vec3( 0.0 ), 1 );
  #endif
}
