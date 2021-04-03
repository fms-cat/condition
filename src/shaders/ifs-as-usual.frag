#version 300 es

precision highp float;

#define lofi(i,j) (floor((i)/(j))*(j))
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

#ifdef DEPTH
  out vec4 fragColor;
#endif

uniform float ifsSeed;
uniform vec2 resolution;
uniform vec2 cameraNearFar;
uniform vec3 cameraPos;
uniform mat4 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 inversePVM;

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

  for ( int i = 0; i < 5; i ++ ) {
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

float map( vec3 p ) {
  vec4 isect;

  vec3 pt = p;

  float clampbox = box( pt, vec3( 1.0 ) );

  vec3 r = mix(
    fs( vec3( 4.7, 3.2, 4.3 ) + floor( ifsSeed ) ),
    fs( vec3( 4.7, 3.2, 4.3 ) + floor( ifsSeed + 1.0 ) ),
    fract( ifsSeed )
  );
  vec3 t = vec3( 4.8, 3.8, 4.2 );
  pt = ifs( pt, r, 0.2 * t );
  pt = ifs( pt, r.yzx, 0.1 * t.yzx );

  float d = max( box( pt, vec3( 0.09 ) ), clampbox );

  return d;
}

vec3 normalFunc( vec3 p, float dd ) {
  vec2 d = vec2( 0.0, dd );
  return normalize( vec3(
    map( p + d.yxx ) - map( p - d.yxx ),
    map( p + d.xyx ) - map( p - d.xyx ),
    map( p + d.xxy ) - map( p - d.xxy )
  ) );
}

void main() {
  vec2 p = ( gl_FragCoord.xy * 2.0 - resolution ) / resolution.y;

  vec3 rayOri = divideByW( inversePVM * vec4( p, 0.0, 1.0 ) );
  vec3 farPos = divideByW( inversePVM * vec4( p, 1.0, 1.0 ) );
  vec3 rayDir = normalize( farPos - rayOri );
  float rayLen = length( vPositionWithoutModel.xyz - rayOri );
  vec3 rayPos = rayOri + rayDir * rayLen;
  float isect;

  for ( int i = 0; i < MARCH_ITER; i ++ ) {
    isect = map( rayPos );
    rayLen += 0.8 * isect;
    rayPos = rayOri + rayDir * rayLen;

    if ( abs( isect ) < 1E-3 ) { break; }
    if ( rayLen > cameraNearFar.y ) { break; }
  }

  if ( 0.01 < isect ) {
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
    fragWTF = vec4( vec3( 0.6, 0.8, 0.0 ), 2 );
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
