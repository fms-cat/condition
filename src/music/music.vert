#version 300 es

precision highp float;

const float SAMPLES = 16.0;
const float INV_SAMPLES = 1.0 / SAMPLES;
const float PI = 3.14159265359;
const float TAU = 6.28318530718;
const float BPM = 180.0;
const float BEAT = 60.0 / BPM;
const float SECTION_BEGIN = 16.0 * BEAT;
const float SECTION_NEURO = 144.0 * BEAT;
const float SECTION_WHOA = 272.0 * BEAT;
const float SECTION_PORTER_FUCKING_ROBINSON = 336.0 * BEAT;
const float SECTION_AAAA = 400.0 * BEAT;
const float SECTION_PSY = 464.0 * BEAT;

#define saturate(i) clamp(i, 0.,1.)
#define aSaturate(i) clamp((i),-1.,1.)
#define fs(i) (fract(sin((i)*114.514)*1919.810))
#define linearstep(a,b,x) saturate(((x)-(a))/((b)-(a)))
#define n2r(n) (pow(2.,((n)-1.)/12.))
#define n2f(n) (n2r(float(n))*440.)
#define lofi(i,j) (floor((i)/(j))*(j))
#define saw(p) (2.*fract(p)-1.)
#define pwm(x,d) (step(fract(x),(d))*2.0-1.0)
#define tri(p) (1.-4.*abs(fract(p)-0.5))
#define snesloop(t,s,l) ((t)-lofi(max((t)-(s),0.0),(l)))

uniform float bpm;
uniform float sampleRate;
uniform float bufferLength;
uniform float _deltaSample;
uniform vec4 timeLength;
uniform vec4 _timeHead;
uniform sampler2D samplerRandom;
uniform sampler2D samplerSamples;
uniform sampler2D samplerAutomaton;

in float off;

out float outL;
out float outR;

float auto( float y ) {
  return texture( samplerAutomaton, vec2( off / bufferLength, y ) ).x;
}

vec2 fbm( vec2 p ) {
  vec2 sum = vec2( 0.0 );

  sum += 0.5 * texture( samplerRandom, p * 0.0625 ).xy;
  sum += 0.25 * texture( samplerRandom, p * 0.125 ).xy;
  sum += 0.125 * texture( samplerRandom, p * 0.25 ).xy;
  sum += 0.0625 * texture( samplerRandom, p * 0.5 ).xy;

  return sum;
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

vec2 wavetable( float phase, vec2 radius, vec2 offset ) {
  float p = TAU * phase;
  return 1.0 - 2.0 * fbm( radius * vec2( sin( p ), cos( p ) ) + offset ).xy;
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

float kick( float t, float attackRatio ) {
  if ( t < 0.0 ) { return 0.0; }

  float phase = 50.0 * t;
  phase -= 15.0 * attackRatio * exp( -200.0 * t );
  phase -= 9.4 * ( 0.5 + 0.5 * attackRatio ) * exp( -30.0 * t );
  return exp( -4.0 * t ) * sin( TAU * phase );
}

vec2 deepkick( float t ) {
  if ( t < 0.0 ) { return vec2( 0.0 ); }

  vec2 tt = t + mix( 0.0, 0.007, smoothstep( 0.0, 0.1, t ) ) * wavetable( 0.1 * t, vec2( 2.0 ), vec2( -0.1 ) );
  vec2 phase = 50.0 * tt - 3.0 * exp( -100.0 * tt ) - 5.4 * exp( -30.0 * tt );
  return exp( -0.4 * tt ) * sin( TAU * phase );
}

vec2 longclap( float t, float tg ) {
  if ( t < 0.0 ) { return vec2( 0.0 ); }

  vec2 tt = t + lofi( exp( -1.0 * t ) * 0.008 * wavetable( tg, vec2( 0.3 ), vec2( 0.0 ) ), 0.0003 );
  return aSaturate( (
    sin( tt * 3000.0 * vec2( 1.005, 0.995 ) - exp( -tt * 300.0 ) * 50.0 ) * mix( exp( -tt * 30.0 ), exp( -1.0 * tt ), 0.04 ) * 2.0
  ) * 4.0 );
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

vec2 snare( float t ) {
  if ( t < 0.0 ) { return vec2( 0.0 ); }

  vec2 fm = exp( -t * 100.0 ) * 1.2 * sin( t * vec2( 2080.0, 2090.0 ) );
  return aSaturate( (
    ( 1.0 - 2.0 * texture( samplerRandom, vec2( t ) / vec2( 0.127, 0.124 ) ).xy ) * exp( -t * 20.0 ) +
    sin( t * 4500.0 * vec2( 1.005, 0.995 ) - exp( -t * 500.0 ) * 50.0 + fm ) * exp( -t * 50.0 ) * 2.0
  ) * 4.0 );
}

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
  wave += 3.0 * sin( TAU * t * freq );

  vec2 tt = t + 0.003 * sin( 3.0 * t + vec2( 0.0, 0.5 ) );

  for ( int i = 0; i < 2; i ++ ) {
    vec2 fm = 0.02 * sin( TAU * tt * freq );
    wave += filterSaw( tt + fm, freq * mix( 0.93, 1.07, float( i ) ), cutrate * 12.0 * freq, 1.0 );
  }

  return aSaturate( 2.0 * wave );
}

vec2 choir( float t ) {
  if ( t < 0.0 ) { return vec2( 0.0 ); }

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

  const int chordsA[8] = int[](
    0, 7, 10, 12, 19, 26, 27, 29
  );

  const int chordsB[48] = int[](
    -4, 3, 5, 10, 12, 19,
    -5, 2, 9, 10, 12, 17,
    0, 5, 7, 14, 15, 22,
    -3, 4, 11, 12, 14, 19,
    -4, 5, 7, 12, 14, 19,
    -5, 2, 9, 10, 12, 17,
    0, 5, 7, 15, 22, 26,
    -3, 3, 7, 12, 17, 22
  );

  int progB = ( time.w < SECTION_AAAA - 8.0 * BEAT )
    ? 6 * ( int( time.z / ( 8.0 * BEAT ) ) % 8 )
    : 36;

  float bassfreq = n2f( 0.0 );

  float sidechain = 1.0;

  // -- kick ---------------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_BEGIN + 64.0 * BEAT, SECTION_NEURO - 14.5 * BEAT ) ) {
    float t = mod( mod( time.z - 1.5 * BEAT, 4.0 * BEAT ), 2.5 * BEAT );
    sidechain = smoothstep( 0.0, 0.7 * BEAT, t );
    dest += 0.25 * kick( t, 0.2 );
  }

  if ( inRange( time.w, SECTION_NEURO - 16.0 * BEAT, SECTION_NEURO ) ) {
    dest += 0.25 * kick( mod( time.z - ( SECTION_NEURO - 16.0 * BEAT ), 64.0 * BEAT ), 0.2 );
  }

  // -- click --------------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_BEGIN + 64.0 * BEAT, SECTION_NEURO - 16.0 * BEAT ) ) {
    float t = mod( time.x, 0.25 * BEAT );
    vec2 w = fbm( vec2( time.w ) ) * 2.0 - 1.0;
    dest += 0.3 * exp( -500.0 * t ) * mix( 0.3, 1.0, sidechain ) * w;
  }

  // -- hihat --------------------------------------------------------------------------------------
  if (
    inRange( time.w, SECTION_BEGIN + 64.0 * BEAT, SECTION_NEURO )
  ) {
    float t = mod( time.x, 0.5 * BEAT );
    dest += 0.03 * mix( 0.3, 1.0, sidechain ) * hihat2( 2.0 * t, 50.0 );
  }

  // -- longclap -----------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_BEGIN + 67.0 * BEAT, SECTION_NEURO - 17.0 * BEAT  ) ) {
    float t = mod( time.y - 3.0 * BEAT, 4.0 * BEAT );
    // float t = mod( time.z - 2.0 * BEAT, 4.0 * BEAT );
    dest += 0.1 * longclap( t, time.w );
  }

  if ( inRange( time.w, SECTION_BEGIN + 64.0 * BEAT, SECTION_NEURO ) ) {
    dest += 0.1 * longclap( time.z - 47.0 * BEAT, time.w );
  }

  // -- pad ----------------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_BEGIN, SECTION_NEURO ) ) {
    vec2 sum = vec2( 0.0 );

    float ph = lofi( time.w - SECTION_BEGIN, 0.5 * BEAT ) / SECTION_NEURO;
    float tb = lofi( time.z, 0.5 * BEAT );
    float t = time.z - tb;
    float rev = 0.02 * exp( -8.0 * t );
    rev += 0.02 * fs( floor( time.z / ( 0.5 * BEAT ) ) );
    vec2 radius = vec2( exp( 4.0 * ( ph - 1.0 ) ) );

    for ( int i = 0; i < 21; i ++ ) {
      float freq = n2f( chordsA[ ( i % 8 ) ] ) * 0.25;
      freq *= 1.0 + 0.01 * ( 0.5 - fs( float( i ) ) );
      float phase = tri( time.w * freq ) * rev;
      sum += 0.1 * inRangeSmooth( t, 0.0, 0.48 * BEAT, 1E3 ) * wavetable( phase, radius, vec2( 0.3 * float( i ) ) );
    }

    if ( inRange( time.w, SECTION_BEGIN + 64.0 * BEAT, SECTION_NEURO ) ) {
      for ( int i = 0; i < 7; i ++ ) {
        float rate = n2r( float( chordsA[ i ] ) ) * 0.5;
        sum += 0.1 * choir( time.z * rate * 0.5 );
      }
    }

    dest += 0.14 * mix( 0.3, 1.0, sidechain ) * aSaturate( sum );
  }

  // -- choir --------------------------------------------------------------------------------------
  if ( inRange( time.w, 0.0, SECTION_PORTER_FUCKING_ROBINSON ) ) {
    const int notes[7] = int[](
      10, 0, 10, 7, -5, 0, -5
    );

    vec2 sum = vec2( 0.0 );

    vec2 radius = vec2( 0.00002 );
    float tb = lofi( time.z, 0.5 * BEAT );
    float t = time.z - tb;

    for ( int i = 0; i < 21; i ++ ) {
      int note = notes[ int( time.z / ( 0.5 * BEAT ) ) % 7 ];
      float freq = n2f( note ) * 0.25;
      freq *= 1.0 + 0.01 * ( 0.5 - fs( float( i ) ) );
      float phase = 2.0 * tri( time.w * freq );
      sum += 0.1 * inRangeSmooth( t, 0.0, 0.5 * BEAT, 1E3 ) * wavetable( phase, radius, vec2( 0.3 * float( i ) ) );
    }

    //dest += 0.14 * aSaturate( sum );
  }

  // -- kick ---------------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_NEURO, SECTION_WHOA - 2.5 * BEAT ) ) {
    float t = mod( mod( mod( time.y, 4.0 * BEAT ), 3.25 * BEAT ), 1.75 * BEAT );
    sidechain = smoothstep( 0.0, 0.7 * BEAT, t );
    dest += 0.25 * kick( t, 1.0 );
  }

  // -- hihat --------------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_NEURO, SECTION_WHOA - 4.0 * BEAT ) ) {
    float t = mod( time.x, 0.25 * BEAT );
    float decay = mix( 40.0, 100.0, fs( floor( time.z / ( 0.25 * BEAT ) ) ) );
    dest += 0.13 * mix( 0.3, 1.0, sidechain ) * hihat2( t, decay );
  }

  // -- snare --------------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_NEURO, SECTION_WHOA - 4.0 * BEAT ) ) {
    float t = mod( time.y - 2.0 * BEAT, 4.0 * BEAT );
    dest += 0.1 * snare( t );
  }

  // -- neuro bass ---------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_NEURO, SECTION_WHOA ) ) {
    vec2 sum = vec2( 0.0 );

    float t = auto( AUTO_NEURO_TIME );
    float det = 0.01 * auto( AUTO_NEURO_DETUNE );
    float detPhase = auto( AUTO_NEURO_DETUNE_PHASE );
    float wubIntensity = auto( AUTO_NEURO_WUB_AMP );
    float wubFreq = auto( AUTO_NEURO_WUB_FREQ );

    for ( int i = 0; i < 5; i ++ ) {
      float fi = float( i );

      float tt = t + det * fi * sin( fi * detPhase + 1.0 * t );

      float radius = 0.1 * wubIntensity * fbm( 0.1 * vec2( sin( TAU * n2f( -36.0 ) * wubFreq * tt ) ) ).x;

      float phase = 0.2 * tri( n2f( -36.0 ) * tt );
      vec2 uv = radius * vec2( sin( phase ), cos( phase ) ) + 0.4;

      sum += 0.3 * ( 2.0 * fbm( uv ) - 1.0 );
    }

    dest += mix( 0.0, 1.0, sidechain ) * 0.27 * aSaturate( sum );
    dest += mix( 0.0, 1.0, sidechain ) * 0.2 * sin( n2f( -36.0 ) * TAU * t );
  }

  // -- kick ---------------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_WHOA, SECTION_PORTER_FUCKING_ROBINSON ) ) {
    float t = mod( time.z, 8.0 * BEAT );
    sidechain = smoothstep( 0.0, 0.7 * BEAT, t );
    dest += 0.25 * kick( t, 1.0 );
  }

  // -- snare --------------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_WHOA, SECTION_PORTER_FUCKING_ROBINSON - 4.0 * BEAT ) ) {
    float t = mod( time.z - 4.0 * BEAT, 8.0 * BEAT );
    dest += 0.1 * snare( t );
  }

  // -- amen ---------------------------------------------------------------------------------------
  if (
    inRange( time.w, SECTION_WHOA, SECTION_PORTER_FUCKING_ROBINSON - 4.0 * BEAT ) &&
    inRange( mod( time.z, 8.0 * BEAT ), 4.0 * BEAT, 8.0 * BEAT )
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

  // -- neuro bass ---------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_WHOA, SECTION_PORTER_FUCKING_ROBINSON ) ) {
    vec2 sum = vec2( 0.0 );

    float t = auto( AUTO_NEURO_TIME );
    float det = 0.01 * auto( AUTO_NEURO_DETUNE );
    float detPhase = auto( AUTO_NEURO_DETUNE_PHASE );
    float wubIntensity = auto( AUTO_NEURO_WUB_AMP );
    float wubFreq = auto( AUTO_NEURO_WUB_FREQ );
    float freq = n2f( chordsB[ progB ] ) * 0.125;

    for ( int i = 0; i < 5; i ++ ) {
      float fi = float( i );

      float tt = t + det * fi * sin( fi * detPhase + 1.0 * t );

      float radius = 0.1 * wubIntensity * fbm( 0.1 * vec2( sin( TAU * freq * wubFreq * tt ) ) ).x;

      float phase = 0.2 * tri( freq * tt );
      vec2 uv = radius * vec2( sin( phase ), cos( phase ) ) + 0.4;

      sum += 0.3 * ( 2.0 * fbm( uv ) - 1.0 );
    }

    dest += mix( 0.0, 1.0, sidechain ) * 0.27 * aSaturate( sum );
    dest += mix( 0.0, 1.0, sidechain ) * 0.2 * sin( freq * TAU * t );
  }

  // -- choir --------------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_WHOA, SECTION_PORTER_FUCKING_ROBINSON - 0.5 * BEAT ) ) {
    vec2 sum = vec2( 0.0 );

    float t = mod( time.z, 8.0 * BEAT );
    vec2 radius = vec2( 0.02 + 0.01 * ( 1.0 - exp( -t ) ) );

    for ( int i = 0; i < 18; i ++ ) {
      float freq = n2f( chordsB[ ( i % 6 ) + progB ] ) * 0.5;
      freq *= 1.0 + 0.05 * ( 0.5 - fs( float( i ) ) );
      float phase = 0.4 * saw( t * freq ) + t;
      float fm = 0.2 * wavetable( phase, radius, vec2( 0.2 + 0.3 * float( i ) ) ).x;
      sum += 0.3 * mix( 0.0, 1.0, sidechain ) * wavetable( phase + fm, radius, vec2( 0.3 * float( i ) ) );
    }

    for ( int i = 0; i < 6; i ++ ) {
      float rate = n2r( float( chordsB[ i + progB ] ) );
      sum += 0.4 * mix( 0.0, 1.0, sidechain ) * choir( t * rate * 0.5 );
    }

    float release = ( ( time.z > 60.0 * BEAT ) ? 2.0 : 1E3 );
    dest += 0.09 * inRangeSmooth( t, 0.0, 4.0 * BEAT, release ) * aSaturate( 2.0 * sum );
  }

  // -- reversecrash -------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_WHOA, SECTION_PORTER_FUCKING_ROBINSON - 0.5 * BEAT ) ) {
    dest += 0.1 * crash( max( 0.0, 63.5 * BEAT - time.z ) );
  }

  // -- kick ---------------------------------------------------------------------------------------
  // float tKick = mod( mod( time.y, 2.25 * BEAT ), 1.75 * BEAT );
  // float tKick = mod( mod( time.y, 4.0 * BEAT ), 2.5 * BEAT );
  float tKick = time.w < SECTION_PORTER_FUCKING_ROBINSON ? 1E9
    : time.w < SECTION_AAAA - 8.0 * BEAT ? time.x + mod( lofi( time.z, BEAT ), 8.0 * BEAT )
    : time.w < SECTION_AAAA ? 1E9
    : time.w < SECTION_AAAA + 1.0 * BEAT ? time.x + mod( lofi( time.z, BEAT ), 8.0 * BEAT )
    : time.w < SECTION_PSY ? 1E9
    : time.x;
  {
    sidechain = smoothstep( 0.0, 0.7 * BEAT, tKick );
    dest += 0.25 * kick( tKick, 1.0 );
  }

  // -- longsnare -----------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_PORTER_FUCKING_ROBINSON, SECTION_AAAA - 8.0 * BEAT ) ) {
    float t = mod( lofi( time.z - 4.0, 1.0 * BEAT ), 8.0 * BEAT ) + time.x;
    // float t = mod( time.z - 2.0 * BEAT, 4.0 * BEAT );
    dest += 0.12 * longsnare( t );
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
    !inRange( time.w, 0.0, SECTION_PORTER_FUCKING_ROBINSON ) &&
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
    float freq = n2f( -36 );
    float fm = -0.009 * exp( -6.0 * t ) * sin( TAU * 1.0 * freq * t );
    vec2 wave = ( 1.0 - exp( -t * 400.0 ) ) * filterSaw( vec2( t ) + fm, freq, cutoff, 0.0 );
    dest += 0.12 * sidechain * wave * exp( -max( 0.0, t - 0.22 * BEAT ) * 400.0 );
  }

  // -- superbass ----------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_PORTER_FUCKING_ROBINSON, SECTION_AAAA ) ) {
    float t = mod( time.z, 8.0 * BEAT );
    t += 1.0 * inRangeInteg( time.z, 28.0 * BEAT, 31.75 * BEAT, 50.0 );
    float freq = n2f( chordsB[ progB ] ) * 0.125;
    float fadetime = max( 0.0, time.w - SECTION_AAAA + 8.0 * BEAT );
    dest += 0.11 * exp( -1.0 * fadetime ) * mix( 0.1, 1.0, sidechain ) * superbass( t, freq, exp( -2.0 * fadetime ) );
  }

  // -- choir --------------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_PORTER_FUCKING_ROBINSON, SECTION_AAAA - 8.0 * BEAT ) ) {
    vec2 sum = vec2( 0.0 );

    float t = mod( time.z, 8.0 * BEAT );
    vec2 radius = vec2( 0.01 + 0.03 * ( 1.0 - exp( -t ) ) );

    for ( int i = 0; i < 18; i ++ ) {
      float freq = n2f( chordsB[ ( i % 6 ) + progB ] ) * ( 0.25 + 0.25 * float( i % 2 ) );
      freq *= 1.0 + 0.03 * ( 0.5 - fs( float( i ) ) );
      float phase = t * freq;
      sum += 0.2 * mix( 0.2, 1.0, sidechain ) * wavetable( phase, radius, vec2( 0.03 * float( i ) ) );
    }

    for ( int i = 0; i < 6; i ++ ) {
      float rate = n2r( float( chordsB[ i + progB ] ) );
      sum += 0.3 * mix( 0.2, 1.0, sidechain ) * choir( t * rate * 0.5 );
    }

    dest += 0.1 * aSaturate( sum );
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
      dest += 0.08 * exp( -0.5 * fi ) * mix( 0.2, 1.0, sidechain ) * harp( t * rate * 0.5 );
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

    int note = notes[ prog ];
    int prevNote = notes[ progPrev ];
    float notef = float( note ) + float( note - prevNote ) * exp( -200.0 * t );

    for ( int i = 0; i < 16; i ++ ) {
      float fi = float( i );
      vec2 freq = n2f( notef ) * vec2( 0.5 );
      vec2 vib = freq * exp( -3.0 * t ) * 0.002 * sin( 20.0 * time.z + 6.0 * vec2( fs( fi ), fs( fi + 1.89 ) ) );
      vec2 phase = saw( t * freq + vib );
      sum += 0.1 * mix( 0.2, 1.0, sidechain ) * phase;
    }

    dest += 0.14 * aSaturate( sum );
  }

  // -- deepkick -----------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_BEGIN, SECTION_BEGIN + 64.0 * BEAT ) ) {
    dest += 0.3 * deepkick( time.z );
  }

  if ( inRange( time.w, SECTION_PORTER_FUCKING_ROBINSON - 4.0 * BEAT, SECTION_PORTER_FUCKING_ROBINSON - 0.5 * BEAT ) ) {
    dest += 0.3 * deepkick( time.y );
  }

  if ( inRange( time.w, SECTION_AAAA - 8.0 * BEAT, SECTION_AAAA ) ) {
    dest += 0.3 * deepkick( mod( time.z, 8.0 * BEAT ) );
  }

  // -- buildup ------------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_AAAA + 32.0 * BEAT, SECTION_PSY ) ) {
    float ph = linearstep( SECTION_AAAA + 32.0 * BEAT, SECTION_PSY, time.w );
    vec2 radius = vec2( 0.03 * ( 1.0 + ph + sin( ph * 3000.0 ) ) );
    dest += 0.12 * ph * wavetable( ph * ( 0.5 + ph ) * 8000.0, radius, vec2( 0.4 ) );
  }

  // -- hi-cut kick --------------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_AAAA, SECTION_PSY ) ) {
    float t = time.x;
    float ph = linearstep( SECTION_AAAA, SECTION_PSY, time.w );

    t = ( time.w > SECTION_PSY - 16.0 * BEAT ) ? mod( t, 0.5 * BEAT ) : t;
    t = ( time.w > SECTION_PSY - 8.0 * BEAT ) ? mod( t, 0.25 * BEAT ) : t;
    t = ( time.w > SECTION_PSY - 6.0 * BEAT ) ? mod( t, 0.125 * BEAT ) : t;
    float decay = mix( 200.0, 0.0, sqrt( ph ) );

    dest += 0.2 * kick( t, 1.0 ) * exp( -decay * t );
    dest += 0.1 * inRangeFloat( time.w, SECTION_PSY - 32.0 * BEAT, 1E9 ) * clap( t );
    dest += 0.05 * ph * inRangeFloat( time.w, SECTION_PSY - 16.0 * BEAT, 1E9 ) * snare909( t );
  }

  // -- fill, before psy ---------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_PSY - 4.0 * BEAT, SECTION_PSY ) ) {
    dest *= 0.0;
    dest += 0.2 * inRangeSmooth( time.y, 0.0, 2.0 * BEAT, 100.0 ) * texture( samplerRandom, time.y / vec2( 0.17, 0.19 ) ).xy;

    float choirTime = time.y - lofi( time.y, 0.03 ) * 0.6;
    dest += 0.2 * inRangeSmooth( time.y, 2.0 * BEAT, 3.5 * BEAT, 100.0 ) * choir( 0.2 * choirTime ).xy;

    dest += 0.2 * kick( time.y - 3.5 * BEAT, 1.0 ) * inRangeSmooth( time.y, 3.0 * BEAT, 3.75 * BEAT, 100.0 );
  }

  // -- fill, psy crashes --------------------------------------------------------------------------
  if ( inRange( time.w, SECTION_PSY + 61.0 * BEAT, SECTION_PSY + 64.0 * BEAT ) ) {
    dest *= 0.0;

    float stretch = time.x - lofi( time.x, 0.02 ) * 0.9;
    float range = inRangeFloat( time.y, 0.0 * BEAT, 1.75 * BEAT );
    dest += 0.2 * kick( stretch, 1.0 ) * range;
    dest += 0.1 * crash( stretch ) * range;

    dest += 0.2 * kick( mod( time.x - 0.25 * BEAT, 0.5 * BEAT ), 1.0 ) * inRangeFloat( time.y, 1.75 * BEAT, 2.5 * BEAT );

    dest += 0.2 * kick( mod( time.x, 0.5 * BEAT ), 1.0 ) * inRangeFloat( time.y, 2.5 * BEAT, 1E9 );
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
