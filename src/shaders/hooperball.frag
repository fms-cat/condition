#version 300 es

// rip of https://www.shadertoy.com/view/tsyBWD

precision highp float;

#define fs(i) (fract(sin((i)*114.514)*1919.810))
#define lofi(i,j) (floor((i)/(j))*(j))
#define saturate(x) clamp(x,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))

const int MARCH_ITER = 90;
const float PI = 3.14159265;
const float TAU = PI * 2.0;
const float foldcos = cos( PI / 5.0 );
const float foldrem = sqrt( 0.75 - foldcos * foldcos );
const vec3 foldvec = vec3( -0.5, -foldcos, foldrem );
const vec3 foldface = vec3( 0.0, foldrem, foldcos );
const vec3 foldu = vec3( 1.0, 0.0, 0.0 );
const vec3 foldv = normalize( cross( foldu, foldface ) );

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

uniform float deformSeed;
uniform float time;
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

struct Heck{
  vec2 coord;
  vec2 cell;
  float len;
};

vec2 uv2heck( vec2 v ) {
  v.y *= 2.0 / sqrt( 3.0 );
  v.x += v.y * 0.5;
  return v;
}

vec2 heck2uv( vec2 v ) {
  v.y /= 2.0 / sqrt( 3.0 );
  v.x -= v.y * 0.5;
  return v;
}

Heck doHeck( vec2 v, float scale ) {
  Heck heck;

  v = uv2heck( v ) * scale;

  heck.cell.x = floor( v.x );
  heck.cell.y = lofi( v.y + heck.cell.x + 2.0, 3.0 ) - heck.cell.x - 2.0;
  heck.coord = v - heck.cell - vec2( 0.0, 1.0 );

  bool a = heck.coord.x < heck.coord.y;
  heck.cell += a ? vec2( 0.0, 2.0 ) : vec2( 1.0, 1.0 );
  heck.coord += a ? vec2( 0.0, -1.0 ) : vec2( -1.0, 0.0 );

  heck.cell = heck2uv( heck.cell / scale );

  heck.len = max( abs( heck.coord.x ), abs( heck.coord.y ) );
  heck.len = max( heck.len, abs( heck.coord.y - heck.coord.x ) );

  return heck;
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

vec3 fold( vec3 p ) {
  for ( int i = 0; i < 5; i ++ ) {
    p.xy = abs( p.xy );
    p -= 2.0 * min( dot( foldvec, p ), 0.0 ) * foldvec;
  }
  return p;
}

vec4 mapIcosa(vec3 p){
  p.zx = rot2d( 0.8 * time ) * p.zx;
  p.xy = rot2d( 1.8 * time ) * p.xy;
  p = fold( p );

  vec3 isect = p / dot( foldface, p );
  vec2 uv = vec2( dot( isect, foldu ), dot( isect, foldv ) );

  float phase = deformSeed;
  float scale = 5.0 + 4.0 * sin( 1.8 * phase );
  Heck heck = doHeck( uv, scale );
  vec3 point = normalize( foldface + heck.cell.x * foldu + heck.cell.y * foldv );

  phase += 4.7 * length( heck.cell );
  float height = 1.0 + 0.1 * sin( 4.9 * phase );

  float dotPointP = dot( point, p );
  float d = max( dotPointP - height, ( heck.len - 0.4 / dotPointP ) / scale * dotPointP * dotPointP );
  vec4 ia = vec4( d, 1, 0, 0 );

  float width = 0.8 + 0.2 * sin( 7.6 * phase );
  float haha = abs( dotPointP - height ) - 0.02;
  float haha2 = ( heck.len - width ) / scale * dotPointP;
  d = max( haha, haha2 );
  vec4 ib = vec4( d, 2, step( -0.03, heck.len - width ) * step( -haha, 0.03 ), 0 );

  ia = ib.x < ia.x ? ib : ia;

  return ia;
}

vec4 map( vec3 p ) {
  vec3 pt = p;
  return mapIcosa( pt );
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

  vec3 modelNormal = normalize( normalMatrix * vec4( normalFunc( rayPos, 1E-3 ), 1.0 ) ).xyz;

  vec4 modelPos = modelMatrix * vec4( rayPos, 1.0 );
  vec4 projPos = projectionMatrix * viewMatrix * modelPos; // terrible
  float depth = projPos.z / projPos.w;
  gl_FragDepth = 0.5 + 0.5 * depth;

  #ifdef DEFERRED
    fragPosition = vec4( modelPos.xyz, depth );
    fragNormal = vec4( modelNormal, 1.0 );

    if ( isect.y == 1.0 ) {
      fragColor = vec4( vec3( 0.1 ), 1.0 );
      fragWTF = vec4( vec3( 0.8, 0.7, 0.0 ), 2 );
    } else if ( isect.y == 2.0 ) {
      if ( isect.z > 0.99 ) {
        fragColor = vec4( 0.1, 0.5, 0.4, 1.0 );
        fragWTF = vec4( vec3( 0.8, 0.1, 1.0 ), 2 );
      } else {
        fragColor = vec4( vec3( 0.1 ), 1.0 );
        fragWTF = vec4( vec3( 0.7, 0.8, 0.0 ), 2 );
      }
    }

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
