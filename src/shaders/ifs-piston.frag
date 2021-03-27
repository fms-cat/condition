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

in vec4 vPosition;

#ifdef SHADOW
  out vec4 fragColor;
#endif

uniform float deformAmp;
uniform float deformFreq;
uniform float deformTime;
uniform float time;
uniform float ifsSeed;
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

#pragma glslify: orthBasis = require( ./modules/orthBasis );
#pragma glslify: cyclicNoise = require( ./modules/cyclicNoise );

vec3 ifs( vec3 p, vec3 r, vec3 t ) {
  vec3 s = t;
  mat3 bas = orthBasis( r );

  for ( int i = 0; i < 6; i ++ ) {
    p = abs( p ) - abs( s ) * pow( 1.7, -float( i ) );

    s = bas * s;

    p.xy = p.x < p.y ? p.yx : p.xy;
    p.yz = p.y < p.z ? p.zy : p.yz;
  }

  return p;
}

float box( vec3 p, vec3 s ) {
  vec3 d = abs( p ) - s;
  return min( 0.0, max( d.x, max( d.y, d.z ) ) ) + length( max( vec3( 0.0 ), d ) );
}

vec4 map( vec3 p ) {
  p.y += 10.0;

  float d1, d2;

  {
    float clampbox = box( p - vec3( 0.0, 10.0, 0.0 ), vec3( 1.0, 10.0, 1.0 ) - 0.1 );

    vec3 r = mix(
      fs( vec3( 4.7, 2.2, 8.3 ) + floor( ifsSeed ) ),
      fs( vec3( 4.7, 2.2, 8.3 ) + floor( ifsSeed + 1.0 ) ),
      fract( ifsSeed )
    );
    vec3 t = 0.1 * vec3( 3.0, 2.3, 3.5 );
    vec3 pt = ifs( p, r, t );

    pt = mod( pt - 0.1, 0.2 ) - 0.1;

    d1 = max( box( pt, vec3( 0.02 ) ), clampbox );
  }

  {
    float clampbox = box( p - vec3( 0.0, 10.0, 0.0 ), vec3( 1.0, 10.0, 1.0 ) );

    vec3 r = mix(
      fs( vec3( 5.3, 1.1, 2.9 ) + floor( ifsSeed ) ),
      fs( vec3( 5.3, 1.1, 2.9 ) + floor( ifsSeed + 1.0 ) ),
      fract( ifsSeed )
    );
    vec3 t = 0.2 * vec3( 3.0, 2.3, 3.5 );
    vec3 pt = ifs( p, r, t );

    pt = mod( pt - 0.1, 0.2 ) - 0.1;

    d2 = max( box( pt, vec3( 0.07 ) ), clampbox );
  }

  return d1 < d2 ? vec4( d1, 1, 0, 0 ) : vec4( d2, 2, 0, 0 );
}

vec3 normalFunc( vec3 p, float dd ) {
  vec2 d = vec2( 0.0, dd );
  return normalize( vec3(
    map( p + d.yxx ).x - map( p - d.yxx ).x,
    map( p + d.xyx ).x - map( p - d.xyx ).x,
    map( p + d.xxy ).x - map( p - d.xxy ).x
  ) );
}

void main() {
  vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.y;

  vec3 rayOri = divideByW( inversePVM * vec4( p, 0.0, 1.0 ) );
  vec3 farPos = divideByW( inversePVM * vec4( p, 1.0, 1.0 ) );
  vec3 rayDir = normalize( farPos - rayOri );
  float rayLen = length( vPosition.xyz - cameraPos );
  vec3 rayPos = rayOri + rayDir * rayLen;
  vec4 isect;

  for ( int i = 0; i < MARCH_ITER; i ++ ) {
    isect = map( rayPos );
    rayLen += 0.5 * isect.x;
    rayPos = rayOri + rayDir * rayLen;

    if ( abs( isect.x ) < 1E-3 ) { break; }
    if ( rayLen > cameraNearFar.y ) { break; }
  }

  if ( 0.01 < isect.x ) {
    discard;
  }

  vec3 modelNormal = ( normalMatrix * vec4( normalFunc( rayPos, 1E-3 ), 1.0 ) ).xyz;

  vec4 modelPos = modelMatrix * vec4( rayPos, 1.0 );
  vec4 projPos = projectionMatrix * viewMatrix * modelPos; // terrible
  float depth = projPos.z / projPos.w;
  gl_FragDepth = 0.5 + 0.5 * depth;

  #ifdef DEFERRED
    fragPosition = vec4( modelPos.xyz, depth );
    fragNormal = vec4( modelNormal, 1.0 );

    if ( isect.y == 2.0 ) {
      vec3 noise = cyclicNoise( 6.0 * rayPos );
      vec3 noiseDetail = cyclicNoise( vec3( 38.0, 1.0, 1.0 ) * ( orthBasis( vec3( 1 ) ) * rayPos ) );
      float roughness = (
        0.6 +
        0.1 * noise.x +
        0.2 * smoothstep( -0.2, 0.4, noise.y ) * ( 0.8 + 0.2 * sin( 17.0 * noiseDetail.x ) )
      );

      fragColor = vec4( vec3( 0.4 ), 1.0 );
      fragWTF = vec4( vec3( roughness, 0.9, 0.0 ), MTL_PBR );
    } else if ( isect.y == 1.0 ) {
      fragColor = vec4( vec3( 1.0 ), 1.0 );
      fragWTF = vec4( vec3( 0.3, 0.1, 0.0 ), MTL_PBR );
    }

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
