#version 300 es

precision highp float;

#define fs(i) (fract(sin((i)*114.514)*1919.810))
#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

const int MARCH_ITER = 90;
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
    p = abs( p ) - abs( s ) * pow( 1.8, -float( i ) );

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
  vec4 isect;

  {
    vec3 pt = p;

    float clampbox = box( pt, vec3( 1.0, 10.0, 1.0 ) );

    pt.y += 10.0;

    vec3 r = mix(
      fs( vec3( 4.7, 2.2, 8.3 ) + floor( ifsSeed ) ),
      fs( vec3( 4.7, 2.2, 8.3 ) + floor( ifsSeed + 1.0 ) ),
      fract( ifsSeed )
    );
    vec3 t = 0.1 * vec3( 4.2, 3.5, 2.2 );
    pt = ifs( pt, r, t );

    pt = mod( pt - 0.1, 0.2 ) - 0.1;

    isect = vec4( max( box( pt, vec3( 0.04 ) ), clampbox ), 2, 0, 0 );
  }

  {
    vec3 pt = p;

    float clampbox = box( pt, vec3( 1.0, 10.0, 1.0 ) - 0.1 );

    pt.y += 10.0;

    vec3 r = mix(
      fs( vec3( 5.3, 1.1, 2.9 ) + floor( ifsSeed ) ),
      fs( vec3( 5.3, 1.1, 2.9 ) + floor( ifsSeed + 1.0 ) ),
      fract( ifsSeed )
    );
    vec3 t = 0.2 * vec3( 3.0, 2.3, 3.5 );
    pt = ifs( pt, r, t );

    pt = mod( pt - 0.1, 0.2 ) - 0.1;

    vec4 isectb = vec4( clampbox, 2, 0, 0 );
    isect = isectb.x < isect.x ? isectb : isect;
  }

  {
    vec3 pt = abs( p );

    float d = box( pt - vec3( 1.0, 0.0, 1.0 ), vec3( 0.02, 9.9, 0.02 ) );

    vec4 isectb = vec4( d, 3, 0, 0 );
    isect = isectb.x < isect.x ? isectb : isect;
  }

  return isect;
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
  float rayLen = length( vPositionWithoutModel.xyz - rayOri );
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
      vec3 noise = cyclicNoise( 3.0 * rayPos );
      vec3 noiseDetail = cyclicNoise( vec3( 38.0, 1.0, 1.0 ) * ( orthBasis( vec3( 1 ) ) * rayPos ) );
      float roughness = (
        0.6 +
        0.1 * noise.x +
        0.2 * smoothstep( -0.2, 0.4, noise.y ) * ( 0.8 + 0.2 * sin( 17.0 * noiseDetail.x ) )
      );

      fragColor = vec4( vec3( 0.4 ), 1.0 );
      fragWTF = vec4( vec3( roughness, 0.9, 0.0 ), 2 );
    } else if ( isect.y == 1.0 ) {
      fragColor = vec4( vec3( 1.0 ), 1.0 );
      fragWTF = vec4( vec3( 0.3, 0.1, 0.0 ), 2 );
    } else if ( isect.y == 3.0 ) {
      fragColor = vec4( vec3( 1.0, 0.001, 0.03 ), 1.0 );
      fragWTF = vec4( vec3( 0.1, 0.1, 1.0 ), 2 );
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
