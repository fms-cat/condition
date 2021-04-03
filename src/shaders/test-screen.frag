#version 300 es

#define saturate(i) clamp(i, 0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define fs(i) (fract(sin((i)*114.514)*1919.810))

precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform float time;
uniform float fade;
uniform float circle;
uniform float mode;
uniform vec2 resolution;
uniform sampler2D samplerRandom;

void main() {
  if ( mode == 1.0 ) {
    fragColor = vec4( vUv, fade, 1.0 );
  } else if ( mode == 2.0 ) {
    vec2 p = vUv * 2.0 - 1.0;
    p.x *= resolution.x / resolution.y;

    float shape = linearstep( 2.0 / resolution.y, 0.0, length( p ) - 0.3 * circle );
    fragColor = vec4( vec3( shape ), 1.0 );
  }
}
