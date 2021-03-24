#version 300 es

precision highp float;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

const int MARCH_ITER = 90;
const int MTL_UNLIT = 1;
const int MTL_PBR = 2;
const int MTL_GRADIENT = 3;
const int MTL_IRIDESCENT = 4;

in vec2 vP;

#ifdef DEFERRED
  layout (location = 0) out vec4 fragPosition;
  layout (location = 1) out vec4 fragNormal;
  layout (location = 2) out vec4 fragColor;
  layout (location = 3) out vec4 fragWTF;
#endif

#ifdef SHADOW
  out vec4 fragColor;
#endif

uniform float deformAmp;
uniform float deformFreq;
uniform float deformTime;
uniform float time;
uniform vec2 resolution;
uniform vec2 cameraNearFar;
uniform vec3 cameraPos;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 inversePVM;
uniform sampler2D samplerRandom;
uniform sampler2D samplerRandomStatic;
uniform sampler2D samplerCapture;

vec3 divideByW( vec4 v ) {
  return v.xyz / v.w;
}

mat2 rot2d( float t ) {
  float c = cos( t );
  float s = sin( t );
  return mat2( c, -s, s, c );
}

#pragma glslify: noise = require( ./-simplex4d );
#pragma glslify: distFunc = require( ./-distFunc );

float box( vec3 p, vec3 s ) {
  vec3 d = abs( p ) - s;
  return min( 0.0, max( d.x, max( d.y, d.z ) ) ) + length( max( vec3( 0.0 ), d ) );
}

float fDistFunc( vec3 p ) {
  float distSlasher;

  if ( length( p ) > 2.0 ) { return length( p ) - 1.8; }

  {
    vec3 pt = p;

    pt.xy = rot2d( 0.5 ) * pt.xy;
    pt.yz = rot2d( 0.5 ) * pt.yz;

    pt.y = mod( pt.y - 0.02, 0.04 ) - 0.02;
    distSlasher = box( pt, vec3( 1E1, 0.015, 1E1 ) );
  }

  float dist = distFunc( p, time );
  dist += 0.5 * deformAmp / deformFreq * noise( vec4( deformFreq * p.xyz, 4.0 * deformFreq * deformTime ) );

  return max( distSlasher, dist );
}

vec3 normalFunc( vec3 p, float dd ) {
  vec2 d = vec2( 0.0, dd );
  return normalize( vec3(
    fDistFunc( p + d.yxx ) - fDistFunc( p - d.yxx ),
    fDistFunc( p + d.xyx ) - fDistFunc( p - d.xyx ),
    fDistFunc( p + d.xxy ) - fDistFunc( p - d.xxy )
  ) );
}

void main() {
  vec2 p = vP;

  vec3 rayOri = divideByW( inversePVM * vec4( p, 0.0, 1.0 ) );
  vec3 farPos = divideByW( inversePVM * vec4( p, 1.0, 1.0 ) );
  vec3 rayDir = normalize( farPos - rayOri );
  float rayLen = cameraNearFar.x;
  vec3 rayPos = rayOri + rayDir * rayLen;
  float dist;

  for ( int i = 0; i < MARCH_ITER; i ++ ) {
    dist = fDistFunc( rayPos );
    rayLen += 0.5 * dist;
    rayPos = rayOri + rayDir * rayLen;

    if ( abs( dist ) < 1E-3 ) { break; }
    if ( rayLen > cameraNearFar.y ) { break; }
  }

  if ( 0.01 < dist ) {
    discard;
  }

  vec3 normal = normalFunc( rayPos, 1E-2 );
  vec4 color = vec4( 0.4, 0.7, 0.9, 1.0 );

  vec4 projPos = projectionMatrix * viewMatrix * vec4( rayPos, 1.0 ); // terrible
  float depth = projPos.z / projPos.w;
  gl_FragDepth = 0.5 + 0.5 * depth;

  #ifdef DEFERRED
    fragPosition = vec4( rayPos, depth );
    fragNormal = vec4( normal, 1.0 );
    fragColor = color;
    fragWTF = vec4( vec3( 0.9, 0.2, 0.0 ), MTL_PBR );
  #endif

  #ifdef SHADOW
    float shadowDepth = linearstep(
      cameraNearFar.x,
      cameraNearFar.y,
      length( cameraPos - rayPos )
    );
    fragColor = vec4( shadowDepth, shadowDepth * shadowDepth, shadowDepth, 1.0 );
  #endif
}
