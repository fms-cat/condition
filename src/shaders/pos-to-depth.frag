#version 300 es

precision highp float;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

in vec2 vUv;

out vec4 fragColor;

uniform vec2 cameraNearFar;
uniform vec3 cameraPos;
uniform sampler2D sampler0;

void main() {
  vec4 tex = texture( sampler0, vUv );
  float depth = linearstep(
    cameraNearFar.x,
    cameraNearFar.y,
    length( cameraPos - tex.xyz )
  );
  fragColor = vec4( depth, depth * depth, depth, 1.0 );
}
