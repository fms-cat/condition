#version 300 es

precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform sampler2D samplerDry;
uniform sampler2D samplerWet;

void main() {
  fragColor = texture( samplerDry, vUv );
  for ( int i = 0; i < 5; i ++ ) {
    float fuck = pow( 0.5, float( i ) );
    vec2 suv = mix( vec2( 1.0 - fuck ), vec2( 1.0 - 0.5 * fuck ), vUv );
    fragColor += texture( samplerWet, suv );
  }
  fragColor.xyz = max( vec3( 0.0 ), fragColor.xyz );
}
