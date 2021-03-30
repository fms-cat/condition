#version 300 es

precision highp float;

const float PI = 3.14159265;
const vec3 LUMA = vec3( 0.2126, 0.7152, 0.0722 );

#define saturate(i) clamp(i,0.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define lofi(i,m) (floor((i)/(m))*(m))

in vec2 vUv;

out vec4 fragColor;

uniform float time;
uniform vec2 resolution;
uniform sampler2D sampler0;

mat2 r2d( float t ) {
  return mat2( cos( t ), sin( t ), -sin( t ), cos( t ) );
}

float smin(float a,float b,float k){
  float h = linearstep( k, 0.0, abs( a - b ) );
  return min( a, b ) - h * h * h * k / 6.0;
}

float dRadial(
  vec2 p,
  float offr,
  float repr,
  float exr,
  float offx,
  float exx,
  float r
) {
  p = r2d( offr ) * p;
  float a = atan( p.y, p.x );
  p = r2d( -lofi( a + repr / 2.0, repr ) ) * p;
  a = atan( p.y, p.x );
  p = r2d( -sign( a ) * min( abs( a ), exr ) ) * p;
  p.x -= offx;
  p.x -= sign( p.x ) * min( abs( p.x ), exx );
  float d = length( p ) - r;
  return d;
}

float sdbox( vec2 p,vec2 d ) {
  vec2 pt = abs( p ) - d;
  return min( max( pt.x, pt.y ), 0.0 ) + length( max( pt, 0.0 ) );
}

float dCirc( vec2 p ) {
  return max( length( p ) - 0.02, 0.018 - length( p ) );
}

float dOverlay( vec2 p ) {
  float d = 1E9;
  float t = time;

  // center bar
  d = min( d, sdbox( p, vec2( 0.12, 0.002 ) ) );

  // circles
  {
    vec2 pt = abs( p );
    d = min( d, dCirc( pt - vec2( 0.0, 0.05 ) ) );
    d = min( d, dCirc( pt - vec2( 0.07, 0.05 ) ) );
    d = min( d, dCirc( pt - vec2( 0.035, 0.05 + 0.035 * sqrt( 3.0 ) ) ) );
  }

  // rings
  {
    float d2 = 1E9;
    d2 = smin( d2, dRadial( p, 0.1 * t, PI / 2.0, PI / 8.0, 0.7, 0.0, 0.02 ), 0.05 );
    d2 = smin( d2, dRadial( p, 0.1 * t + PI / 4.0, PI / 2.0, PI / 8.0, 0.72, 0.0, 0.02 ), 0.05 );
    d = min( d2, d );
  }

  d = min( d, dRadial( p, 0.1 * t, PI / 8.0, PI / 19.0, 0.76, 0.002, 0.0 ) );
  d = min( d, dRadial( p, -0.1 * t, PI / 8.0, PI / 9.0, 0.78, 0.01, 0.0 ) );
  d = min( d, dRadial( p, 0.04 * t, PI / 48.0, 0.002, 0.815, 0.008, 0.0 ) );
  d = min( d, dRadial( p, 0.04 * t, PI / 192.0, 0.002, 0.815, 0.002, 0.0 ) );

  {
    float d2 = 1E9;
    d2 = smin( d2, dRadial( p, 0.1 * t, PI / 1.5, PI / 8.0, 0.86, 0.0, 0.02 ), 0.05 );
    d2 = smin( d2, dRadial( p, 0.1 * t + PI / 4.0, PI / 1.5, PI, 0.88, 0.0, 0.02 ), 0.05 );
    d = min( d2, d );
  }

  d = min( d, dRadial( p, 0.2 * t, PI / 2.0, PI / 4.2, 0.915, 0.002, 0.0 ) );
  d = min( d, dRadial( p, -.1 * t, PI / 4.0, PI / 8.5, 0.94, 0.01, 0.0 ) );
  d = min( d, dRadial( p, 0.04 * t, PI / 96.0, 0.002, 0.99, 0.03, 0.0 ) );

  return d;
}

void main() {
  vec2 uv = vUv;
  vec2 p = ( uv * resolution * 2.0 - resolution ) / resolution.y;

  vec3 col = texture( sampler0, uv ).rgb;

  float d = dOverlay( p * 0.65 );
  float shape = linearstep( 2.0 / resolution.y, 0.0, d );
  col = mix( col, saturate( 0.5 - 0.3 * col.gbr ), shape );

  fragColor = vec4( col, 1.0 );
}
