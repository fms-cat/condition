#version 300 es

precision highp float;

const float WEIGHT_1 = 1.0 / 16.0;
const float WEIGHT_2 = 2.0 / 16.0;
const float WEIGHT_4 = 4.0 / 16.0;

in vec2 vUv;

out vec4 fragColor;

uniform float level;
uniform vec2 resolution;
uniform sampler2D sampler0;

void main() {
  float p = pow( 0.5, level ); // 1.0, 0.5, 0.25...

  vec2 deltaTexel = 1.0 / resolution;

  vec2 uv0 = vec2( 1.0 - p );
  vec2 uv1 = vec2( 1.0 - 0.5 * p );
  vec2 uv = mix( uv0, uv1, vUv );
  uv = clamp( uv, uv0 + 1.5 * deltaTexel, uv1 - 1.5 * deltaTexel );

  // http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
  vec4 tex = WEIGHT_1 * texture( sampler0, uv - deltaTexel * vec2( -1.0, -1.0 ) );
  tex += WEIGHT_2 * texture( sampler0, uv - deltaTexel * vec2(  0.0, -1.0 ) );
  tex += WEIGHT_1 * texture( sampler0, uv - deltaTexel * vec2(  1.0, -1.0 ) );
  tex += WEIGHT_2 * texture( sampler0, uv - deltaTexel * vec2( -1.0,  0.0 ) );
  tex += WEIGHT_4 * texture( sampler0, uv - deltaTexel * vec2(  0.0,  0.0 ) );
  tex += WEIGHT_2 * texture( sampler0, uv - deltaTexel * vec2(  1.0,  0.0 ) );
  tex += WEIGHT_1 * texture( sampler0, uv - deltaTexel * vec2( -1.0,  1.0 ) );
  tex += WEIGHT_2 * texture( sampler0, uv - deltaTexel * vec2(  0.0,  1.0 ) );
  tex += WEIGHT_1 * texture( sampler0, uv - deltaTexel * vec2(  1.0,  1.0 ) );

  vec3 col = tex.rgb;

  fragColor = vec4( col, 1.0 );
}
