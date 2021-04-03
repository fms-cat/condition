#version 300 es

precision highp float;

#define fs(i) (fract(sin((i)*114.514)*1919.810))
#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

const float PI = 3.14159265;
const float TAU = PI * 2.0;

#ifdef FORWARD
  out vec4 fragColor;
#endif

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

uniform int lightCount;
uniform float deformAmp;
uniform float deformFreq;
uniform float deformTime;
uniform float time;
uniform float noiseOffset;
uniform vec2 lightNearFar[ 8 ];
uniform vec2 resolution;
uniform vec2 size;
uniform vec2 cameraNearFar;
uniform vec3 lightPos[ 8 ];
uniform vec3 lightColor[ 8 ];
uniform vec3 cameraPos;
uniform vec4 lightParams[ 8 ];
uniform mat4 lightPV[ 8 ];
uniform mat4 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 inversePVM;
uniform sampler2D samplerRandom;
uniform sampler2D samplerRandomStatic;
uniform sampler2D samplerCapture;
uniform sampler2D samplerShadow[ 8 ];

vec3 divideByW( vec4 v ) {
  return v.xyz / v.w;
}

#pragma glslify: doAnalyticLighting = require( ./modules/doAnalyticLighting.glsl );
#pragma glslify: doShadowMapping = require( ./modules/doShadowMapping.glsl );

vec4 fetchShadowMap( int iLight, vec2 uv ) {
  if ( iLight == 0 ) {
    return texture( samplerShadow[ 0 ], uv );
  } else if ( iLight == 1 ) {
    return texture( samplerShadow[ 1 ], uv );
  } else if ( iLight == 2 ) {
    return texture( samplerShadow[ 2 ], uv );
  } else if ( iLight == 3 ) {
    return texture( samplerShadow[ 3 ], uv );
  } else if ( iLight == 4 ) {
    return texture( samplerShadow[ 4 ], uv );
  } else if ( iLight == 5 ) {
    return texture( samplerShadow[ 5 ], uv );
  } else if ( iLight == 6 ) {
    return texture( samplerShadow[ 6 ], uv );
  } else if ( iLight == 7 ) {
    return texture( samplerShadow[ 7 ], uv );
  }
}

#pragma glslify: orthBasis = require( ./modules/orthBasis );

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
  pt.z -= 4.0 * time;
  pt.zx = mod( pt.zx - 5.0, 10.0 ) - 5.0;

  vec3 r = vec3( 1.6, 0.5, -0.8 );
  vec3 t = vec3( 4.8, 3.7, 2.1 );
  pt = ifs( pt, r, t );
  pt = ifs( pt, r.yzx, 0.4 * t.yzx );

  float d = box( pt, vec3( 0.14 ) );
  d = max( d, abs( p.y ) - 1.0 );

  return d;
}

vec3 nMap( vec3 p, float dd ) {
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
  float dist;

  int MARCH_ITER;

  #ifdef FORWARD
    MARCH_ITER = 10;
  #endif

  #ifdef DEFERRED
    MARCH_ITER = 40;
  #endif

  #ifdef DEPTH
    MARCH_ITER = 10;
  #endif

  for ( int i = 0; i < MARCH_ITER; i ++ ) {
    dist = map( rayPos );
    rayLen += 0.5 * dist;
    rayPos = rayOri + rayDir * rayLen;

    if ( abs( dist ) < 1E-3 ) { break; }
    if ( rayLen > cameraNearFar.y ) { break; }
  }

  if ( 0.01 < dist ) {
    discard;
  }

  vec3 normal = nMap( rayPos, 1E-3 );
  vec3 modelNormal = normalize( normalMatrix * vec4( normal, 1.0 ) ).xyz;

  vec4 modelPos = modelMatrix * vec4( rayPos, 1.0 );
  vec4 projPos = projectionMatrix * viewMatrix * modelPos; // terrible
  float depth = projPos.z / projPos.w;
  gl_FragDepth = 0.5 + 0.5 * depth;

  #ifdef FORWARD
    vec3 color = vec3( 0.0 );

    // for each lights
    for ( int iLight = 0; iLight < 8; iLight ++ ) {
      if ( iLight >= lightCount ) { break; }

      vec3 V = cameraPos - modelPos.xyz;
      vec3 L = lightPos[ iLight ] - modelPos.xyz;

      // shading
      vec3 shade = doAnalyticLighting(
        V,
        L,
        modelNormal,
        vec3( 0.6, 0.5, 0.4 ),
        0.5,
        0.2
      ) * lightColor[ iLight ];

      // fetch shadowmap + spot lighting
      vec4 lightProj = lightPV[ iLight ] * modelPos;
      vec2 lightP = lightProj.xy / lightProj.w;

      shade *= doShadowMapping(
        L,
        modelNormal,
        fetchShadowMap( iLight, 0.5 + 0.5 * lightP ),
        lightP,
        lightNearFar[ iLight ],
        lightParams[ iLight ].x
      );

      color += shade;
    }

    vec3 gradient = 0.5 + 0.5 * cos(
      3.0 + 1.5 * exp( -0.4 * max( rayLen - 3.0, 0.0 ) ) + vec3( 0.0, 2.0, 4.0 )
    );
    float edge = step( 0.1, length( normal - nMap( rayPos, 1E-2 ) ) );

    color += gradient * edge;

    fragColor = vec4( color, 1.0 );
  #endif

  #ifdef DEFERRED
    fragPosition = vec4( modelPos.xyz, depth );
    fragNormal = vec4( modelNormal, 1.0 );
    fragColor = vec4( vec3( 0.0 ), 1.0 );
    fragWTF = vec4( vec3( 1.0, 0.0, 0.0 ), 4 );
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
