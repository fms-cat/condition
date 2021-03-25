#version 300 es

precision highp float;

const float FXAA_REDUCE_MIN = 1.0 / 128.0;
const float FXAA_REDUCE_MUL = 1.0 / 8.0;
const float FXAA_SPAN_MAX = 16.0;

in vec2 vUv;

out vec4 fragColor;

uniform vec2 resolution;
uniform sampler2D sampler0;

void main() {
  vec2 uv = vUv;
  vec4 neighbor = vec4( -1.0, -1.0, 1.0, 1.0 ) / resolution.xyxy;

  vec3 rgb11 = texture( sampler0, vUv ).rgb;
  vec3 rgb00 = texture( sampler0, vUv + neighbor.xy ).rgb;
  vec3 rgb02 = texture( sampler0, vUv + neighbor.xw ).rgb;
  vec3 rgb20 = texture( sampler0, vUv + neighbor.zy ).rgb;
  vec3 rgb22 = texture( sampler0, vUv + neighbor.zw ).rgb;

  vec3 luma = vec3( 0.299, 0.587, 0.114 );
  float luma11 = dot( luma, rgb11 );
  float luma00 = dot( luma, rgb00 );
  float luma02 = dot( luma, rgb02 );
  float luma20 = dot( luma, rgb20 );
  float luma22 = dot( luma, rgb22 );

  float lumaMin = min( luma00, min( min( luma00, luma02 ), min( luma20, luma22 ) ) );
  float lumaMax = max( luma00, max( max( luma00, luma02 ), max( luma20, luma22 ) ) );

  vec2 dir = vec2(
    -( ( luma00 + luma20 ) - ( luma02 + luma22 ) ),
    ( ( luma00 + luma02 ) - ( luma20 + luma22 ) )
  );

  float dirReduce = max(
    ( luma00 + luma02 + luma20 + luma22 ) * 0.25 * FXAA_REDUCE_MUL,
    FXAA_REDUCE_MIN
  );
  float rcpDirMin = 1.0 / ( min( abs( dir.x ), abs( dir.y ) ) + dirReduce );
  dir = min(
    vec2( FXAA_SPAN_MAX ),
    max(
      vec2( -FXAA_SPAN_MAX ),
      dir * rcpDirMin
    )
  ) / resolution;

  vec3 rgbA = 0.5 * (
    texture( sampler0, uv + dir * ( 1.0 / 3.0 - 0.5 ) ).xyz +
    texture( sampler0, uv + dir * ( 2.0 / 3.0 - 0.5 ) ).xyz
  );
  vec3 rgbB = rgbA * 0.5 + 0.25 * (
    texture( sampler0, uv - dir * 0.5 ).xyz +
    texture( sampler0, uv + dir * 0.5 ).xyz
  );

  float lumaB = dot( rgbB, luma );
  fragColor = (
    ( ( lumaB < lumaMin ) || ( lumaMax < lumaB ) ) ?
    vec4( rgbA, 1.0 ) :
    vec4( rgbB, 1.0 )
  );
}
