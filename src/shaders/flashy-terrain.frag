#version 300 es

precision highp float;

const float TAU = 6.283185307;

in float vInstanceId;
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

#pragma glslify: cyclicNoise = require( ./modules/cyclicNoise );

void main() {
  float grid = max(
    step( 0.996, cos( 16.0 * TAU * vPositionWithoutModel.x ) ),
    step( 0.996, cos( 16.0 * TAU * vPositionWithoutModel.y ) )
  );
  vec2 cell = floor( 16.0 * vPositionWithoutModel.xy );
  grid = max(
    grid,
    smoothstep( 0.2, 0.3, cyclicNoise( vec3( cell.xy, 4.0 * time ) ).x )
  );

  #ifdef DEFERRED
    fragPosition = vPosition;
    fragNormal = vec4( 0.0, 0.0, 1.0, 1.0 );
    fragColor = vec4( grid * vec3( 2.0 ), 1.0 );
    fragWTF = vec4( 0.0, 0.0, 0.0, 1 );
  #endif
}
