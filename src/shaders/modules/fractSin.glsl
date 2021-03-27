float fractSin( float s ) {
  return fract( sin( s * 114.514 ) * 1919.810 );
}

#pragma glslify: export(fractSin)
