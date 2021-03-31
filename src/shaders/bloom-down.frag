#version 300 es

precision highp float;

const float WEIGHT_1 = 1.0;
const float WEIGHT_2 = 2.0;
const float WEIGHT_4 = 4.0;
const vec3 LUMA = vec3( 0.299, 0.587, 0.114 );

in vec2 vUv;

out vec4 fragColor;

uniform float level;
uniform vec2 resolution;
uniform sampler2D sampler0;

vec4 fetchWithWeight( vec2 uv ) {
  vec4 tex = texture( sampler0, uv );
  float luma = dot( LUMA, tex.xyz );
  return vec4( tex.xyz, 1.0 + 0.5 * luma );
  // return vec4( tex.xyz, 1.0 + luma );
}

void main() {
  float p = 2.0 * pow( 0.5, level ); // 2.0, 1.0, 0.5, 0.25...

  vec2 deltaTexel = 1.0 / resolution;

  vec2 uv0 = step( 0.5, level ) * vec2( 1.0 - p );
  vec2 uv1 = vec2( 1.0 - step( 0.5, level ) * 0.5 * p );
  vec2 uv = mix( uv0, uv1, vUv );
  uv = clamp( uv, uv0 + deltaTexel, uv1 - deltaTexel );

  // http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare
  vec4 tex = WEIGHT_1 * fetchWithWeight( uv - deltaTexel * vec2( -1.0, -1.0 ) );
  tex += WEIGHT_2 * fetchWithWeight( uv - deltaTexel * vec2(  0.0, -1.0 ) );
  tex += WEIGHT_1 * fetchWithWeight( uv - deltaTexel * vec2(  1.0, -1.0 ) );
  tex += WEIGHT_4 * fetchWithWeight( uv - deltaTexel * vec2( -0.5, -0.5 ) );
  tex += WEIGHT_4 * fetchWithWeight( uv - deltaTexel * vec2(  0.5, -0.5 ) );
  tex += WEIGHT_2 * fetchWithWeight( uv - deltaTexel * vec2( -1.0,  0.0 ) );
  tex += WEIGHT_4 * fetchWithWeight( uv - deltaTexel * vec2(  0.0,  0.0 ) );
  tex += WEIGHT_2 * fetchWithWeight( uv - deltaTexel * vec2(  1.0,  0.0 ) );
  tex += WEIGHT_4 * fetchWithWeight( uv - deltaTexel * vec2( -0.5,  0.5 ) );
  tex += WEIGHT_4 * fetchWithWeight( uv - deltaTexel * vec2(  0.5,  0.5 ) );
  tex += WEIGHT_1 * fetchWithWeight( uv - deltaTexel * vec2( -1.0,  1.0 ) );
  tex += WEIGHT_2 * fetchWithWeight( uv - deltaTexel * vec2(  0.0,  1.0 ) );
  tex += WEIGHT_1 * fetchWithWeight( uv - deltaTexel * vec2(  1.0,  1.0 ) );

  vec3 col = tex.rgb / tex.w;

  if ( level == 0.0 ) {
    float brightness = dot( LUMA, col );
    vec3 normalized = brightness < 1E-4 ? vec3( brightness ) : col / brightness;
    col = max( 0.0, brightness - 0.6 ) * normalized;
  }

  fragColor = vec4( col, 1.0 );
}
