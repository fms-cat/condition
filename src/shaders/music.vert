#version 300 es

precision highp float;

const float SAMPLES = 16.0;
const float INV_SAMPLES = 1.0 / SAMPLES;
const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const float BPM = 180.0;
const float BEAT = 60.0 / BPM;
const float SECTION_PORTER_FUCKING_ROBINSON = 0.0;
const float SECTION_AAAA = 64.0 * BEAT;
const float SECTION_PSY = 128.0 * BEAT;

#define saturate(i) clamp(i, 0.,1.)
#define aSaturate(i) clamp((i),-1.,1.)
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define n2r(n) (pow(2.,((n)-1.)/12.))
#define n2f(n) (n2r(n)*440.)
#define lofi(i,j) (floor((i)/(j))*(j))
#define saw(p) (2.*fract(p)-1.)
#define pwm(x,d) (step(fract(x),(d))*2.0-1.0)
#define tri(p) (1.-4.*abs(fract(p)-0.5))
#define snesloop(t,s,l) ((t)-lofi(max((t)-(s),0.0),(l)))

uniform float bpm;
uniform float sampleRate;
uniform float _deltaSample;
uniform vec4 timeLength;
uniform vec4 _timeHead;
uniform sampler2D samplerRandom;
uniform sampler2D samplerSamples;

in float off;

out float outL;
out float outR;

float fs( float s ) {
  return fract( sin( s * 114.514 ) * 1919.810 );
}

bool inRange( float t, float a, float b ) {
  return ( a < t && t < b );
}

float inRangeFloat( float t, float a, float b ) {
  return inRange( t, a, b ) ? 1.0 : 0.0;
}

float inRangeSmooth( float t, float a, float b, float k ) {
  return ( 1.0 - exp( -k * max( 0.0, t - a ) ) ) * exp( -k * max( 0.0, t - b ) );
}

float inRangeInteg( float t, float a, float b, float k ) {
  return ( t < a )
    ? ( exp( k * ( t - a ) ) / k )
    : ( t < b )
    ? ( t - a + 1.0 / k )
    : ( b - a + ( 2.0 - exp( k * ( b - t ) ) ) / k );
}

vec2 wavetable( float phase, float radius, vec2 offset ) {
  float p = TAU * phase;
  return 1.0 - 2.0 * texture( samplerRandom, radius * vec2( sin( p ), cos( p ) ) + offset ).xy;
}

vec2 filterSaw( vec2 time, float freq, float cutoff, float resonance ) {
  vec2 sum = vec2( 0.0 );

  for ( int i = 1; i <= 32; i ++ ) {
    float fi = float( i );
    float cut = smoothstep( cutoff * 1.2, cutoff * 0.8, fi * freq );
    cut += smoothstep( cutoff * 0.3, 0.0, abs( cutoff - fi * freq ) ) * resonance;
    vec2 offset = vec2( -1.0, 1.0 ) * ( 0.1 * ( fi - 1.0 ) );
    sum += sin( fi * freq * time * TAU + offset ) / fi * cut;
  }

  return sum;
}

float kick( float t ) {
  if ( t < 0.0 ) { return 0.0; }

  float phase = 50.0 * t - 15.0 * exp( -200.0 * t ) - 9.4 * exp( -30.0 * t );
  return exp( -4.0 * t ) * sin( TAU * phase );
}

vec2 longsnare( float t ) {
  if ( t < 0.0 ) { return vec2( 0.0 ); }

  vec2 fm = exp( -t * 50.0 ) * 1.2 * sin( t * vec2( 1080.0, 1090.0 ) );
  return aSaturate( (
    ( 1.0 - 2.0 * texture( samplerRandom, vec2( t ) / vec2( 0.127, 0.124 ) ).xy ) * exp( -t * 6.0 ) +
    sin( t * 3000.0 * vec2( 1.005, 0.995 ) - exp( -t * 300.0 ) * 50.0 + fm ) * mix( exp( -t * 30.0 ), exp( -t ), 0.04 ) * 2.0
  ) * 4.0 );
}

vec2 snare909( float t ) {
  if ( t < 0.0 ) { return vec2( 0.0 ); }

  vec2 sine = sin( t * vec2( 1500.0, 1510.0 ) - exp( -t * 80.0 ) * 30.0 - exp( -t * 300.0 ) * 30.0 );
  return aSaturate( (
    1.0 - 2.0 * texture( samplerRandom, vec2( t ) / vec2( 0.127, 0.124 ) ).xy +
    smoothstep( -1.0, 1.0, sine )
  ) * 2.0 * exp( -t * 10.0 ) );
}

// vec2 snare( float t ) {
//   if ( t < 0.0 ) { return vec2( 0.0 ); }

//   vec2 fm = exp( -t * 100.0 ) * 1.2 * sin( t * vec2( 2080.0, 2090.0 ) );
//   return aSaturate( (
//     ( 1.0 - 2.0 * texture( samplerRandom, vec2( t ) / vec2( 0.127, 0.124 ) ).xy ) * exp( -t * 20.0 ) +
//     sin( t * 4500.0 * vec2( 1.005, 0.995 ) - exp( -t * 500.0 ) * 50.0 + fm ) * exp( -t * 50.0 ) * 2.0
//   ) * 4.0 );
// }

vec2 hihat( float t, float decay ) {
  if ( t < 0.0 ) { return vec2( 0.0 ); }

  float amp = exp( -decay * t );

  float fm = sin( 189.0 * TAU * t );
  vec2 wave = 3.0 * sin( vec2( 22229.0, 22269.0 ) * TAU * t + fm );
  wave -= lofi( wave + 1.0, 2.0 );

  return amp * wave;
}

vec2 hihat2( float t, float decay ) {
  if ( t < 0.0 ) { return vec2( 0.0 ); }

  float fmamp = -5.4 * exp( -decay * t );
  vec2 fm = fmamp * sin( vec2( 25855.0, 25955.0 ) * t );
  float amp = exp( -decay * t );
  vec2 wave = vec2( sin( fm + vec2( 8892.0, 8792.0 ) * t ) );
  wave = 2.0 * ( fract( 2.0 * wave + 0.5 ) - 0.5 );

  return amp * wave;
}

vec2 crash( float t ) {
  if ( t < 0.0 ) { return vec2( 0.0 ); }

  t = t + 0.01 * sin( 0.5 * exp( -40.0 * t ) + 3.0 );
  t = lofi( 0.8 * t, 0.00004 );
  float fmamp = -3.4 * exp( -1.0 * t );
  vec2 fm = fmamp * sin( vec2( 38855.0, 38865.0 ) * t );
  float amp = exp( -3.0 * t );
  vec2 wave = vec2( sin( fm + vec2( 14892.0, 14890.0 ) * t ) );
  wave = 2.0 * ( fract( 2.0 * wave + 0.5 ) - 0.5 );

  return amp * wave;
}

vec2 clap( float t ) {
  if ( t < 0.0 ) { return vec2( 0.0 ); }

  t = t + 0.03 * sin( 10.0 * exp( -120.0 * t ) - 2.0 );
  float amp = 2.0 * exp( -30.0 * t );
  vec2 wave = texture( samplerRandom, t / vec2( 0.25, 0.23 ) + vec2( 0.4, 0.5 ) ).xy;

  return amp * wave;
}

vec2 superbass( float t, float freq, float cutrate ) {
  if ( t < 0.0 ) { return vec2( 0.0 ); }

  vec2 wave = vec2( 0.0 );
  wave += 2.0 * sin( TAU * t * freq );

  vec2 tt = t + 0.003 * sin( 3.0 * t + vec2( 0.0, 0.5 ) );

  for ( int i = 0; i < 2; i ++ ) {
    vec2 fm = 0.02 * sin( TAU * tt * freq );
    wave += filterSaw( tt + fm, freq * mix( 0.93, 1.07, float( i ) ), cutrate * 12.0 * freq, 1.0 );
  }

  return aSaturate( 2.0 * wave );
}

vec2 choir( float t ) {
  vec2 tt0 = snesloop( 0.01 + t * vec2( 0.999, 1.001 ), 0.22, 0.26 );
  tt0 = lofi( tt0, 0.0001 );

  return vec2(
    texture( samplerSamples, vec2( 2.0 * tt0.x, 6.5 * INV_SAMPLES ) ).x, // hardcoded as a row = 0.5 sec
    texture( samplerSamples, vec2( 2.0 * tt0.y, 6.5 * INV_SAMPLES ) ).x
  );
}

vec2 harp( float t ) {
  vec2 tt0 = snesloop( 0.02 + t * vec2( 0.999, 1.001 ), 0.22, 0.26 );
  tt0 = lofi( tt0, 0.0001 );

  return 0.5 * ( exp( -10.0 * t ) + exp( -2.0 * t ) ) * vec2(
    texture( samplerSamples, vec2( 2.0 * tt0.x, 7.5 * INV_SAMPLES ) ).x, // hardcoded as a row = 0.5 sec
    texture( samplerSamples, vec2( 2.0 * tt0.y, 7.5 * INV_SAMPLES ) ).x
  );
}

vec2 mainAudio( vec4 time ) {
  vec2 dest = vec2( 0.0 );

  const int chordsA[14] = int[](
    -4, 2, 5, 7, 12, 14, 19,
    -5, 0, 2, 7, 9, 12, 17
  );

  const int chordsB[48] = int[](
    -4, 0, 3, 5, 10, 19,
    -5, -3, 0, 5, 10, 17,
    0, 5, 7, 14, 15, 22,
    -3, 0, 2, 7, 12, 17,
    -4, 0, 5, 7, 14, 19,
    -5, 2, 9, 10, 12, 17,
    0, 5, 7, 15, 22, 26,
    -3, 3, 7, 12, 17, 22
  );

  int progB = ( time.w < SECTION_AAAA - 8.0 * BEAT )
    ? 6 * ( int( time.w / ( 8.0 * BEAT ) ) % 8 )
    : 36;

  // -- kick ---------------------------------------------------------------------------------------
  // float tKick = mod( mod( time.y, 2.25 * BEAT ), 1.75 * BEAT );
  // float tKick = mod( mod( time.y, 4.0 * BEAT ), 2.5 * BEAT );
  float tKick = time.w < SECTION_AAAA + 1.0 * BEAT
    ? time.x + mod( lofi( time.z, BEAT ), 8.0 * BEAT )
    : time.w < SECTION_PSY
    ? 1E9
    : time.x;
  float sidechain = smoothstep( 0.0, 0.7 * BEAT, tKick );
  {
    dest += 0.25 * kick( tKick );
  }

  // -- snare --------------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_PORTER_FUCKING_ROBINSON, SECTION_AAAA - 8.0 * BEAT ) ) {
    float t = mod( lofi( time.z - 4.0, 1.0 * BEAT ), 8.0 * BEAT ) + time.x;
    // float t = mod( time.z - 2.0 * BEAT, 4.0 * BEAT );
    dest += 0.1 * longsnare( t );
  }

  // -- hihat --------------------------------------------------------------------------------------
  if (
    inRange( time.w, SECTION_AAAA, SECTION_PSY )
  ) {
    float t = mod( time.x - 0.5 * BEAT, BEAT );
    dest += 0.1 * mix( 0.3, 1.0, sidechain ) * hihat2( t, 9.0 );
  }

  if (
    inRange( time.w, SECTION_PORTER_FUCKING_ROBINSON, SECTION_AAAA - 8.0 * BEAT ) ||
    inRange( time.w, SECTION_PSY + 16.0 * BEAT, 1E9 )
  ) {
    float t = mod( time.x, 0.25 * BEAT );
    float decay = mix( 40.0, 100.0, fs( floor( time.z / ( 0.25 * BEAT ) ) ) );
    dest += 0.1 * mix( 0.3, 1.0, sidechain ) * hihat2( t, decay );
  }

  if (
    inRange( time.w, SECTION_PSY + 31.5 * BEAT, 1E9 )
  ) {
    float t = mod( time.x - 0.5 * BEAT, BEAT );
    dest += 0.1 * mix( 0.3, 1.0, sidechain ) * hihat( t, 20.0 );
  }

  // -- clap ---------------------------------------------------------------------------------------
  if (
    inRange( time.w, SECTION_PSY + 64.0 * BEAT, 1E9 )
  ) {
    float t = mod( time.y - 1.0 * BEAT, 2.0 * BEAT );
    dest += 0.1 * clap( t );
  }

  // -- crash ---------------------------------------------------------------------------------------
  if (
    !inRange( time.w, SECTION_PSY, SECTION_PSY + 16.0 * BEAT )
  ) {
    float t = time.z;
    dest += 0.14 * crash( t );
  }

  // -- psysaw -------------------------------------------------------------------------------------
  if (
    inRange( time.w, SECTION_PSY + 64.0 * BEAT, 1E9 )
  ) {
    float t = mod( time.z, 0.25 * BEAT );
    float begin = time.z - t;
    float dice = fs( begin );
    if ( t < ( 0.25 - dice * 0.2 ) * BEAT ) {
      float freq = 20.0 * sin( TAU * begin * 1.8 );
      dest += 0.07 * saw( 20.0 * exp( -2.0 * fract( 10.0 * exp( -freq * t ) ) ) );
    }
  }

  // -- amen ---------------------------------------------------------------------------------------
  if (
    inRange( time.w, SECTION_PORTER_FUCKING_ROBINSON, SECTION_AAAA - 8.0 * BEAT ) ||
    inRange( time.w, SECTION_AAAA, SECTION_PSY )
  ) {
    float chunk = floor( 6.0 * fs( lofi( time.z, 0.5 * BEAT ) ) );
    // float chunk = time.y / ( 1.0 * BEAT );
    vec2 vib = 0.003 * sin( 3.0 * time.z + vec2( 0.0, 0.2 ) );
    vec2 tread = 2.0 * time.x + vib;

    float roll = fs( 2.4 + lofi( time.z, 0.5 * BEAT ) );
    tread -= lofi( tread, BEAT * pow( 0.5, floor( roll * 14.0 - 10.0 ) ) );

    tread = fract( tread / BEAT );

    vec2 tex = vec2(
      texture( samplerSamples, vec2( tread.x, ( chunk + 0.5 ) * INV_SAMPLES ) ).x, // hardcoded as a row = 1 beat
      texture( samplerSamples, vec2( tread.y, ( chunk + 0.5 ) * INV_SAMPLES ) ).x
    );

    dest += 0.1 * smoothstep( -0.8, 0.8, 4.0 * tex );
  }

  // -- psy bass -----------------------------------------------------------------------------------
  if ( SECTION_PSY < time.w ) {
    // float t = mod( aTime - 0.5 beat, 1.0 beat );
    float t = mod( time.x, 0.25 * BEAT );
    float decay = exp( -50.0 * t );
    float cutoff = mix( 100.0, 2000.0, decay );
    float noteI = 0.0;
    float freq = n2f( -36.0 );
    float fm = -0.009 * exp( -6.0 * t ) * sin( TAU * 1.0 * freq * t );
    vec2 wave = ( 1.0 - exp( -t * 400.0 ) ) * filterSaw( vec2( t ) + fm, freq, cutoff, 0.0 );
    dest += 0.12 * sidechain * wave * exp( -max( 0.0, t - 0.22 * BEAT ) * 400.0 );
  }

  // -- superbass ----------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_PORTER_FUCKING_ROBINSON, SECTION_AAAA ) ) {
    float t = mod( time.z, 8.0 * BEAT );
    t += 1.0 * inRangeInteg( time.z, 28.0 * BEAT, 31.5 * BEAT, 50.0 );
    float freq = n2f( float( chordsB[ progB ] ) ) * 0.125;
    float fadetime = max( 0.0, time.w - SECTION_AAAA + 8.0 * BEAT );
    dest += 0.1 * exp( -1.0 * fadetime ) * mix( 0.1, 1.0, sidechain ) * superbass( t, freq, exp( -2.0 * fadetime ) );
  }

  // -- cv bass ------------------------------------------------------------------------------------
  {
    vec2 sum = vec2( 0.0 );

    float t = mod( time.z, 8.0 * BEAT );
    t += 3.7 * inRangeInteg( mod( time.z, 8.0 * BEAT ), 1.05 * BEAT, 1.8 * BEAT, 100.0 );
    float freq = 51.0;
    float fm = -0.2 * sin( 15.0 * TAU * t * freq );
    float radius = 0.005 * sin( 0.5 * TAU * t * freq );
    float rev = 0.3 + fm;
    sum += sin( TAU * freq * t );

    for ( int i = 0; i < 5; i ++ ) {
      freq *= 1.0 + 0.001 * ( 0.5 - fs( float( i ) ) );
      float phase = tri( 7.5 * t * freq ) * rev;
      sum += 0.4 * wavetable( phase, radius, vec2( 0.5 + float( i ) * 0.01 ) );
    }

    // dest += mix( 0.0, 1.0, sidechain ) * 0.2 * aSaturate( sum );
  }

  // -- choir --------------------------------------------------------------------------------------
  {
    vec2 sum = vec2( 0.0 );

    float t = mod( time.z, 8.0 * BEAT );
    int prog = int( mod( time.z / ( 8.0 * BEAT ), 2.0 ) );
    float radius = 0.0004 + 0.002 * ( 1.0 - exp( -t ) );
    float rev = 2.0 * lofi( exp( -fract( t * ( 8.0 + 3.0 * sin( time.w ) ) ) ), 0.05 );

    for ( int i = 0; i < 21; i ++ ) {
      float freq = n2f( float( chordsA[ ( i % 7 ) + 7 * prog ] ) ) * ( 0.25 + 0.25 * float( i % 2 ) );
      freq *= 1.0 + 0.05 * ( 0.5 - fs( float( i ) ) );
      float phase = saw( t * freq ) * rev;
      sum += 0.2 * mix( 0.2, 1.0, sidechain ) * wavetable( phase, radius, vec2( 0.5 + 0.3 * float( i ) ) );
    }

    // dest += 0.14 * aSaturate( sum );
  }

  // -- choir --------------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_PORTER_FUCKING_ROBINSON, SECTION_AAAA - 8.0 * BEAT ) ) {
    vec2 sum = vec2( 0.0 );

    float t = mod( time.z, 8.0 * BEAT );
    float radius = 0.001 + 0.003 * ( 1.0 - exp( -t ) );
    float rev = 0.3;

    for ( int i = 0; i < 18; i ++ ) {
      float freq = n2f( float( chordsB[ ( i % 6 ) + progB ] ) ) * ( 0.25 + 0.25 * float( i % 2 ) );
      freq *= 1.0 + 0.03 * ( 0.5 - fs( float( i ) ) );
      float phase = saw( t * freq ) * rev;
      sum += 0.2 * mix( 0.2, 1.0, sidechain ) * wavetable( phase, radius, vec2( 0.2 + 0.03 * float( i ) ) );
    }

    for ( int i = 0; i < 6; i ++ ) {
      float rate = n2r( float( chordsB[ i + progB ] ) );
      sum += 0.3 * mix( 0.2, 1.0, sidechain ) * choir( t * rate * 0.5 );
    }

    dest += 0.12 * aSaturate( sum );
  }

  // -- harp ---------------------------------------------------------------------------------------
  if (
    inRange( time.w, SECTION_PORTER_FUCKING_ROBINSON, SECTION_PSY )
  ) {
    const int notes[6] = int[](
      0, 5, 7, 14, 15, 22
    );

    for ( int i = 0; i < 4; i ++ ) {
      float fi = float( i );
      float delay = fi * 0.75 * BEAT;
      float t = mod( time.x - delay, 0.5 * BEAT );
      int prog = int( mod( ( time.w - delay ) / ( 0.5 * BEAT ), 6.0 ) );
      float radius = 0.001 + 0.003 * ( 1.0 - exp( -t ) );
      float rev = 0.3;

      float rate = n2r( float( notes[ prog ] ) );
      dest += 0.1 * exp( -0.5 * fi ) * mix( 0.2, 1.0, sidechain ) * harp( t * rate * 0.5 );
    }
  }

  // -- lead ---------------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_PORTER_FUCKING_ROBINSON, SECTION_PSY ) ) {
    const int notes[16] = int[](
      0, 10, 12, 19,
      0, 14, 15, 22,
      0, 17, 19, 26,
      0, 14, 15, 22
    );

    vec2 sum = vec2( 0.0 );

    float t = mod( time.z, 0.5 * BEAT );
    int prog = int( mod( time.z / ( 0.5 * BEAT ), 4.0 ) );
    prog += ( progB / 6 * 4 ) % 16;
    int progPrev = int( mod( ( time.z - 0.5 * BEAT ) / ( 0.5 * BEAT ), 4.0 ) );
    progPrev += int( mod( ( time.z - 0.5 * BEAT ) / ( 8.0 * BEAT ), 4.0 ) );

    float note = float( notes[ prog ] );
    float prevNote = float( notes[ progPrev ] );
    note += ( note - prevNote ) * exp( -200.0 * t );

    for ( int i = 0; i < 16; i ++ ) {
      float fi = float( i );
      vec2 freq = n2f( note ) * vec2( 0.5 );
      vec2 vib = freq * exp( -3.0 * t ) * 0.002 * sin( 20.0 * time.z + 6.0 * vec2( fs( fi ), fs( fi + 1.89 ) ) );
      vec2 phase = saw( t * freq + vib );
      sum += 0.1 * mix( 0.2, 1.0, sidechain ) * phase;
    }

    dest += 0.15 * aSaturate( sum );
  }

  // -- hi-cut kick --------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_AAAA, SECTION_PSY ) ) {
    float t = time.x;
    float ph = linearstep( SECTION_AAAA, SECTION_PSY, time.w );

    t = ( time.w > SECTION_PSY - 16.0 * BEAT ) ? mod( t, 0.5 * BEAT ) : t;
    t = ( time.w > SECTION_PSY - 8.0 * BEAT ) ? mod( t, 0.25 * BEAT ) : t;
    t = ( time.w > SECTION_PSY - 6.0 * BEAT ) ? mod( t, 0.125 * BEAT ) : t;
    float decay = mix( 200.0, 0.0, sqrt( ph ) );

    dest += 0.2 * kick( t ) * exp( -decay * t );
    dest += 0.1 * inRangeFloat( time.w, SECTION_PSY - 32.0 * BEAT, 1E9 ) * clap( t );
    dest += 0.05 * ph * inRangeFloat( time.w, SECTION_PSY - 16.0 * BEAT, 1E9 ) * snare909( t );
  }

  // -- fill, before psy ---------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_PSY - 4.0 * BEAT, SECTION_PSY ) ) {
    dest *= 0.0;
    dest += 0.2 * inRangeSmooth( time.y, 0.0, 2.0 * BEAT, 100.0 ) * texture( samplerRandom, time.y / vec2( 0.17, 0.19 ) ).xy;

    float choirTime = time.y - lofi( time.y, 0.03 ) * 0.6;
    dest += 0.2 * inRangeSmooth( time.y, 2.0 * BEAT, 3.5 * BEAT, 100.0 ) * choir( 0.2 * choirTime ).xy;

    dest += 0.2 * kick( time.y - 3.5 * BEAT ) * inRangeSmooth( time.y, 3.0 * BEAT, 3.75 * BEAT, 100.0 );
  }

  // -- fill, psy crashes --------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_PSY + 61.0 * BEAT, SECTION_PSY + 64.0 * BEAT ) ) {
    dest *= 0.0;

    float stretch = time.x - lofi( time.x, 0.02 ) * 0.9;
    float range = inRangeFloat( time.y, 0.0 * BEAT, 1.75 * BEAT );
    dest += 0.2 * kick( stretch ) * range;
    dest += 0.1 * crash( stretch ) * range;

    dest += 0.2 * kick( mod( time.x - 0.25 * BEAT, 0.5 * BEAT ) ) * inRangeFloat( time.y, 1.75 * BEAT, 2.5 * BEAT );

    dest += 0.2 * kick( mod( time.x, 0.5 * BEAT ) ) * inRangeFloat( time.y, 2.5 * BEAT, 1E9 );
    dest += vec2( 0.1, 0.07 ) * crash( time.y - 2.5 * BEAT ) * inRangeSmooth( time.y, 0.0, 2.75 * BEAT, 400.0 );
    dest += vec2( 0.07, 0.1 ) * crash( time.y - 3.0 * BEAT ) * inRangeSmooth( time.y, 0.0, 3.25 * BEAT, 400.0 );
    dest += vec2( 0.1, 0.07 ) * crash( time.y - 3.5 * BEAT ) * inRangeSmooth( time.y, 0.0, 3.75 * BEAT, 400.0 );
  }

  return aSaturate( dest );
}

void main() {
  vec2 out2 = mainAudio( mod( _timeHead + off * _deltaSample, timeLength ) );
  outL = out2.x;
  outR = out2.y;
}
