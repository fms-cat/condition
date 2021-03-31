#version 300 es

precision highp float;

#define fs(i) (fract(sin((i)*114.514)*1919.810))
#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

const int MARCH_ITER = 90;
const int MTL_UNLIT = 1;
const int MTL_PBR = 2;
const int MTL_GRADIENT = 3;
const int MTL_IRIDESCENT = 4;
const float PI = 3.14159265;
const float TAU = PI * 2.0;

#ifdef DEFERRED
  layout (location = 0) out vec4 fragPosition;
  layout (location = 1) out vec4 fragNormal;
  layout (location = 2) out vec4 fragColor;
  layout (location = 3) out vec4 fragWTF;
#endif

in vec4 vPositionWithoutModel;

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
uniform mat4 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 inversePVM;
uniform sampler2D samplerRandom;
uniform sampler2D samplerRandomStatic;
uniform sampler2D samplerCapture;

vec3 divideByW( vec4 v ) {
  return v.xyz / v.w;
}

// https://www.iquilezles.org/www/articles/smin/smin.htm
float smin( float a, float b, float k ) {
  float h = max( k - abs( a - b ), 0.0 ) / k;
  return min( a, b ) - h * h * h * k * ( 1.0 / 6.0 );
}

mat2 rot2d( float t ) {
  float c = cos( t );
  float s = sin( t );
  return mat2( c, -s, s, c );
}

#pragma glslify: noise = require( ./-simplex4d );

float box( vec3 p, vec3 s ) {
  vec3 d = abs( p ) - s;
  return min( 0.0, max( d.x, max( d.y, d.z ) ) ) + length( max( vec3( 0.0 ), d ) );
}

float distFunc( vec3 p ) {
  // if ( length( p ) > 2.0 ) { return length( p ) - 1.8; }

  float distSlasher;
  {
    vec3 pt = p;

    pt.xy = rot2d( 0.5 ) * pt.xy;
    pt.yz = rot2d( 0.5 ) * pt.yz;

    pt.y = mod( pt.y - 0.02, 0.04 ) - 0.02;
    distSlasher = box( pt, vec3( 1E1, 0.015, 1E1 ) );
  }

  float distMetaball;
  {
    distMetaball = length( p ) - 0.4;
    for ( int i = 0; i < 3; i ++ ) {
      float fi = float( i );
      vec3 offset = fs( fi * vec3( 2.8, 4.55, 3.12 ) );
      vec3 freq = 1.0 + 3.0 * fs( fi * vec3( 4.14, 2.15, 0.18 ) );
      vec3 trans = 0.5 * sin( 6.0 * offset + time * freq );
      distMetaball = smin( distMetaball, length( p - trans ) - 0.4, 1.0 );
      distMetaball = smin( distMetaball, length( p + trans ) - 0.4, 1.0 );
    }
  }

  distMetaball += 0.5 * deformAmp / deformFreq * noise(
    vec4( deformFreq * p.xyz, 4.0 * deformFreq * deformTime )
  );

  return max( distSlasher, distMetaball );
}

vec3 normalFunc( vec3 p, float dd ) {
  vec2 d = vec2( 0.0, dd );
  return normalize( vec3(
    distFunc( p + d.yxx ) - distFunc( p - d.yxx ),
    distFunc( p + d.xyx ) - distFunc( p - d.xyx ),
    distFunc( p + d.xxy ) - distFunc( p - d.xxy )
  ) );
}

void main() {
  vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.y;

  vec3 rayOri = divideByW( inversePVM * vec4( p, 0.0, 1.0 ) );
  vec3 farPos = divideByW( inversePVM * vec4( p, 1.0, 1.0 ) );
  vec3 rayDir = normalize( farPos - rayOri );
  float rayLen = length( vPositionWithoutModel.xyz - rayOri );
  vec3 rayPos = rayOri + rayDir * rayLen;
  float dist;

  for ( int i = 0; i < MARCH_ITER; i ++ ) {
    dist = distFunc( rayPos );
    rayLen += 0.5 * dist;
    rayPos = rayOri + rayDir * rayLen;

    if ( abs( dist ) < 1E-3 ) { break; }
    if ( rayLen > cameraNearFar.y ) { break; }
  }

  if ( 0.01 < dist ) {
    discard;
  }

  vec3 modelNormal = normalize( normalMatrix * vec4( normalFunc( rayPos, 1E-2 ), 1.0 ) ).xyz;

  vec4 modelPos = modelMatrix * vec4( rayPos, 1.0 );
  vec4 projPos = projectionMatrix * viewMatrix * modelPos; // terrible
  float depth = projPos.z / projPos.w;
  gl_FragDepth = 0.5 + 0.5 * depth;

  #ifdef DEFERRED
    fragPosition = vec4( modelPos.xyz, depth );
    fragNormal = vec4( modelNormal, 1.0 );
    fragColor = vec4( vec3( 0.3 ), 1.0 );
    fragWTF = vec4( vec3( 1.0, 0.1, 0.0 ), MTL_PBR );
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
