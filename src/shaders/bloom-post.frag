#version 300 es

precision highp float;

in vec2 vUv;

out vec4 fragColor;

uniform vec2 resolution;
uniform sampler2D samplerDry;
uniform sampler2D samplerWet;

vec4 sampleLOD( vec2 uv, float lv ) {
  float p = pow( 0.5, float( lv ) );
  vec2 halfPixel = 0.5 / resolution;
  vec2 uv00 = vec2( 1.0 - p );
  vec2 uv11 = vec2( 1.0 - 0.5 * p );
  vec2 uvt = mix( uv00, uv11, uv );
  uvt = clamp( uvt, uv00 + halfPixel, uv11 - halfPixel );
  return texture( samplerWet, uvt );
}

void main() {
  fragColor = texture( samplerDry, vUv );
  for ( int i = 0; i < 5; i ++ ) {
    fragColor += sampleLOD( vUv, float( i ) );
  }
  fragColor.xyz = max( vec3( 0.0 ), fragColor.xyz );
}
