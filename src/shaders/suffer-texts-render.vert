#version 300 es

#define fs(i) (fract(sin((i)*114.514)*1919.810))
#define saturate(i) clamp(i,0.,1.)
#define lofi(i,m) (floor((i)/(m))*(m))
#define lofir(i,m) (floor((i+0.5)/(m))*(m))

// -------------------------------------------------------------------------------------------------

in float computeX;
in vec2 position;

out float vLife;
out vec2 vUv;
out vec2 vSize;
out vec3 vNormal;
out vec4 vPosition;

uniform vec2 resolution;
uniform vec2 resolutionCompute;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;
uniform mat4 normalMatrix;
uniform sampler2D samplerCompute0;
uniform sampler2D samplerRandomStatic;

// == utils ========================================================================================
vec2 yflip( vec2 uv ) {
  return vec2( 0.0, 1.0 ) + vec2( 1.0, -1.0 ) * uv;
}

// == main procedure ===============================================================================
void main() {
  vec2 computeUV = vec2( computeX, 0.5 );
  vec4 tex0 = texture( samplerCompute0, computeUV );

  // == assign varying variables ===================================================================
  vLife = tex0.w;

  float char = tex0.z;
  char += 64.0 * ( min( vLife, 0.3 ) + max( vLife, 0.7 ) - 1.0 );

  vUv = yflip( 0.5 + 0.499 * position );
  vUv = ( vUv + floor( mod( vec2( char / vec2( 1.0, 16.0 ) ), 16.0 ) ) ) / 16.0;

  vNormal = normalize( ( normalMatrix * vec4( 0.0, 0.0, 1.0, 1.0 ) ).xyz );

  // == compute size ===============================================================================
  float scale = 0.0625;

  vPosition = vec4( scale * 1.2 * tex0.xy, 0.0, 1.0 );
  vPosition.y = -vPosition.y;

  vec2 shape = position * scale * 0.5;

  vPosition.xy += shape;

  // == send the vertex position ===================================================================
  vPosition = vPosition;
  vec4 outPos = vPosition;
  outPos.x *= resolution.y / resolution.x;
  gl_Position = outPos;

  vPosition.w = outPos.z / outPos.w;
}
