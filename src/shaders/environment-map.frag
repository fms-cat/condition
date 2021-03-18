#version 300 es

// https://learnopengl.com/PBR/IBL/Specular-IBL

precision highp float;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

#pragma glslify: prng = require( ./-prng );

const int SAMPLES = 16;
const float UV_MARGIN = 0.9;
const float PI = 3.14159265;
const float TAU = 6.283185307;

in vec2 vUv;

out vec4 fragColor;

uniform float head;
uniform vec2 resolution;
uniform vec4 uniformSeed;
uniform sampler2D sampler0;
uniform samplerCube samplerCubemap;

vec4 seed;

float vdc( float i, float base ) {
  float r = 0.0;
  float denom = 1.0;

  for ( int j = 0; j < 32; j ++ ) {
    denom *= base;
    r += mod( i, base ) / denom;
    i = floor( i / base );

    if ( i <= 0.0 ) { break; }
  }

  return r;
}

vec3 ImportanceSampleGGX( vec2 Xi, float roughness, vec3 N ) {
  float a = roughness * roughness;

  float phi = TAU * Xi.x;
  float cosTheta = roughness < 0.0 // negative roughness to usa lambert ???
    ? asin( sqrt( Xi.y ) )
    : sqrt( ( 1.0 - Xi.y ) / ( 1.0 + ( a * a - 1.0 ) * Xi.y ) );
  float sinTheta = sqrt( 1.0 - cosTheta * cosTheta );

  // from spherical coordinates to cartesian coordinates
  vec3 H = vec3(
    cos( phi ) * sinTheta,
    sin( phi ) * sinTheta,
    cosTheta
  );

  // from tangent-space vector to world-space sample vector
  vec3 up = abs( N.y ) < 0.999 ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
  vec3 tangent = normalize( cross( up, N ) );
  vec3 bitangent = cross( N, tangent );

  vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
  return normalize( sampleVec );
}

vec3 haha( vec3 L ) {
  return texture( samplerCubemap, L ).xyz;
}

void main() {
  vec2 halfTexel = 1.0 / resolution; // * 0.5;

  float lv = ceil( -log( 1.0 - min( vUv.x, vUv.y ) ) / log( 2.0 ) );
  float p = pow( 0.5, lv );
  vec2 uv00 = floor( vUv / p ) * p;
  vec2 uv11 = uv00 + p;
  vec2 uv = clamp( vUv, uv00 + halfTexel, uv11 - halfTexel );
  uv = linearstep( uv00, uv11, uv );
  uv = ( uv - 0.5 ) / UV_MARGIN + 0.5;

  vec3 tex = texture( sampler0, vUv ).xyz;
  float roughness = lv * 0.2;

  float a = TAU * uv.x;
  float b = PI * ( uv.y - 0.5 );
  vec3 N = vec3( -sin( a ) * cos( b ), sin( b ), -cos( a ) * cos( b ) );
  vec3 R = N;
  vec3 V = R;

  seed = uniformSeed + 500.0 * N.xyzx;

  vec4 col = vec4( 0.0 );
  for ( int i = 0; i < SAMPLES; i ++ ) {
    vec2 Xi = vec2( prng( seed ), prng( seed ) );
    vec3 H = ImportanceSampleGGX( Xi, roughness, N );
    vec3 L = normalize( 2.0 * dot( V, H ) * H - V );

    float NoL = dot( N, L );

    if ( NoL > 0.0 ) {
      col += vec4( haha( L ), 1.0 ) * NoL;
    }
  }

  col.xyz = col.w <= 0.001 ? vec3( 0.0 ) : ( col.xyz / col.w );

  tex.xyz = mix( tex.xyz, col.xyz, 1.0 / 4.0 );

  fragColor = vec4( tex, 1.0 );
}
