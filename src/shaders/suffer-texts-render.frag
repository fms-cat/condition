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

out vec4 fragColor;

// == main procedure ===============================================================================
void main() {
  if ( vLife > 1.3 ) { discard; }

  float tex = texture( samplerTinyChar, vUv ).x;
  if ( tex < 0.5 ) { discard; }

  vec3 color = vec3( 1.0 );
  color = mix(
    step( 2.0, mod( 40.0 * vLife + vec3( 0.0, 1.0, 2.0 ), 3.0 ) ),
    color,
    smoothstep( 0.0, 0.3, vLife ) * smoothstep( 1.3, 1.0, vLife )
  );

  fragColor = vec4( color, 1.0 );
}
