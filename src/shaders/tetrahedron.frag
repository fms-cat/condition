#version 300 es

precision highp float;

#define fs(i) (fract(sin((i)*114.514)*1919.810))
#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

const float PI = 3.14159265;
const float TAU = PI * 2.0;
const float foldcos = cos( PI / 3.0 );
const float foldrem = sqrt( 0.75 - foldcos * foldcos );
const vec3 foldvec = vec3( -0.5, -foldcos, foldrem );
const vec3 foldface = vec3( 0.0, foldrem, foldcos );

#ifdef DEFERRED
  layout (location = 0) out vec4 fragPosition;
  layout (location = 1) out vec4 fragNormal;
  layout (location = 2) out vec4 fragColor;
  layout (location = 3) out vec4 fragWTF;
#endif

in vec4 vPositionWithoutModel;

#ifdef DEPTH
  out vec4 fragColor;
#endif

uniform float distort;
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

#pragma glslify: noise = require( ./-simplex4d );
#pragma glslify: orthBasis = require( ./modules/orthBasis );

vec3 fold( vec3 p ) {
  for ( int i = 0; i < 5; i ++ ) {
    p.xy = abs( p.xy );
    p -= 2.0 * min( dot( foldvec, p ), 0.0 ) * foldvec;
  }
  return p;
}

float distFunc( vec3 p ) {
  vec3 pt = p;
  pt = fold( pt );
  float d = dot( pt, foldface ) - 0.36;

  d += ( 0.001 + 0.02 * distort ) * noise(
    vec4( 8.0 * p.xyz, 8.0 * time )
  );

  return d;
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

  int MARCH_ITER;

  #ifdef DEFERRED
    MARCH_ITER = 50;
  #endif

  #ifdef DEPTH
    MARCH_ITER = 30;
  #endif

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

  vec3 modelNormal = normalize( normalMatrix * vec4( normalFunc( rayPos, 1E-3 ), 1.0 ) ).xyz;

  vec4 modelPos = modelMatrix * vec4( rayPos, 1.0 );
  vec4 projPos = projectionMatrix * viewMatrix * modelPos; // terrible
  float depth = projPos.z / projPos.w;
  gl_FragDepth = 0.5 + 0.5 * depth;

  #ifdef DEFERRED
    fragPosition = vec4( modelPos.xyz, depth );
    fragNormal = vec4( modelNormal, 1.0 );
    fragColor = vec4( vec3( 0.2 ), 1.0 );
    fragWTF = vec4( vec3( 0.05 , 0.93, 0.0 ), 2 );
  #endif

  #ifdef DEPTH
    float shadowDepth = linearstep(
      cameraNearFar.x,
      cameraNearFar.y,
      length( cameraPos - modelPos.xyz )
    );
    fragColor = vec4( shadowDepth, shadowDepth * shadowDepth, shadowDepth, 1.0 );
  #endif
}
