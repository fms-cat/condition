#version 300 es

precision highp float;

const float RADIUS = 40.0;
const vec3 CIRCLE_COLOR = vec3( 1.0, 1.0, 1.0 );

in vec2 vUv;

out vec4 fragColor;

uniform vec2 resolution;
uniform vec2 mouse;
uniform sampler2D sampler0;

bool print( in vec2 _coord, float _in ) {
  vec2 coord = _coord;

  // vertical restriction
  if ( coord.y <= 0.0 || 5.0 <= coord.y ) { return false; }

  // dot
  if ( 0.0 < coord.x && coord.x < 2.0 ) {
    return coord.x < 1.0 && coord.y < 1.0;
  }

  // padded by dot
  if ( 2.0 < coord.x ) { coord.x -= 2.0; }

  // determine digit
  float ci = floor( coord.x / 5.0 ) + 1.0;

  // too low / too high
  if ( 4.0 < ci ) { return false; }
  if ( ci < -4.0 ) { return false; }

  // x of char
  float cfx = floor( mod( coord.x, 5.0 ) );

  // width is 4
  if ( 4.0 == cfx ) { return false; }

  // y of char
  float cfy = floor( coord.y );

  // bit of char
  float cf = cfx + 4.0 * cfy;

  // determine char
  float num = 0.0;
  if ( 0.0 < ci ) {
    float n = abs( _in );
    for ( int i = 0; i < 6; i ++ ) {
      if ( ci < float( i ) ) { break; }

      num = mod( floor( n ), 10.0 );
      n -= num;
      n *= 10.0;
    }
  } else {
    float n = abs( _in );
    for ( int i = 0; i < 6; i ++ ) {
      if ( -ci < float( i ) ) { break; }

      if ( ci != 0.0 && n < 1.0 ) {
        // minus
        return float( i ) == -ci && _in < 0.0 && cfy == 2.0 && 0.0 < cfx;
      }
      num = mod( floor( n ), 10.0 );
      n -= num;
      n /= 10.0;
    }
  }

  bool a;
  a = 1.0 == mod( floor( (
    num == 0.0 ? 432534.0 :
    num == 1.0 ? 410692.0 :
    num == 2.0 ? 493087.0 :
    num == 3.0 ? 493191.0 :
    num == 4.0 ? 630408.0 :
    num == 5.0 ? 989063.0 :
    num == 6.0 ? 399254.0 :
    num == 7.0 ? 1016898.0 :
    num == 8.0 ? 431766.0 :
    433798.0
  ) / pow( 2.0, cf ) ), 2.0 );

  return a ? true : false;
}

void main() {
  vec2 uv = vUv;
  vec2 coord = vUv * resolution;

  vec2 center = floor( mouse * resolution + vec2( 1.0, 0.7 ) * RADIUS );
  float circle = length( coord.xy - center ) - RADIUS;

  vec4 col = texture( sampler0, uv );
  vec4 mcol = texture( sampler0, mouse );
  float mcolb = dot( mcol.rgb, vec3( 0.299, 0.587, 0.114 ) );
  vec4 bcol = vec4( vec3( step( mcolb, 0.5 ) ), 1.0 );

  col = mix(
    col,
    mix(
      bcol,
      mcol,
      smoothstep( 1.0, 0.0, circle + 5.0 )
    ),
    smoothstep( 1.0, 0.0, circle )
  );

  if ( circle < 0.0 ) {
    col = print( coord.xy - center - vec2( 0.0, 8.0 ), mcol.x ) ? bcol : col;
    col = print( coord.xy - center - vec2( 0.0, 0.0 ), mcol.y ) ? bcol : col;
    col = print( coord.xy - center - vec2( 0.0, -8.0 ), mcol.z ) ? bcol : col;
    col = print( coord.xy - center - vec2( 0.0, -16.0 ), mcol.w ) ? bcol : col;
  }

  fragColor = col;
}
