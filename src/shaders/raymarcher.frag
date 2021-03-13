#version 300 es

precision highp float;

#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

const int MARCH_ITER = 50;
const int MTL_UNLIT = 1;
const int MTL_PBR = 2;
const int MTL_GRADIENT = 3;
const int MTL_IRIDESCENT = 4;

in vec2 vUv;

layout (location = 0) out vec4 fragPosition;
layout (location = 1) out vec4 fragNormal;
layout (location = 2) out vec4 fragColor;
layout (location = 3) out vec4 fragWTF;

uniform float time;
uniform vec2 resolution;
uniform vec2 cameraNearFar;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 inversePV;
uniform sampler2D samplerRandom;
uniform sampler2D samplerRandomStatic;
uniform sampler2D samplerCapture;

vec3 divideByW( vec4 v ) {
  return v.xyz / v.w;
}

#pragma glslify: distFunc = require( ./-distFunc );

float fDistFunc( vec3 p ) {
  return distFunc( p, time );
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
  vec2 p = vUv * 2.0 - 1.0;
  p.x *= resolution.x / resolution.y;
  vec3 rayOri = divideByW( inversePV * vec4( p, 0.0, 1.0 ) );
  vec3 farPos = divideByW( inversePV * vec4( p, 1.0, 1.0 ) );
  vec3 rayDir = normalize( farPos - rayOri );
  float rayLen = cameraNearFar.x;
  vec3 rayPos = rayOri + rayDir * rayLen;
  float dist;

  for ( int i = 0; i < MARCH_ITER; i ++ ) {
    dist = distFunc( rayPos, time );
    rayLen += 0.7 * dist;
    rayPos = rayOri + rayDir * rayLen;

    if ( abs( dist ) < 1E-3 ) { break; }
  }

  if ( 0.01 < dist ) {
    discard;
  }

  vec3 normal = normalFunc( rayPos, 1E-4 );
  vec4 color = vec4( 0.1, 0.2, 0.4, 1.0 );

  vec4 projPos = projectionMatrix * viewMatrix * vec4( rayPos, 1.0 ); // terrible
  float depth = projPos.z / projPos.w;
  gl_FragDepth = 0.5 + 0.5 * depth;

  fragPosition = vec4( rayPos, depth );
  fragNormal = vec4( normal, 1.0 );
  fragColor = color;
  fragWTF = vec4( vec3( 2.0, 0.9, 0.9 ), MTL_IRIDESCENT );
}
