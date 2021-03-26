/**
 * Generate a number using Van der Corput sequence.
 * e.g. vdc(i, 2) = 1/2, 1/4, 3/4, 1/8, 5/8, 3/8, 7/8, 1/16, ...
 * @param i Index of the sequence
 * @param base Base of the sequence
 */
export function vdc( i: number, base: number ): number {
  let r = 0;
  let denom = 1;

  while ( 0 < i ) {
    denom *= base;
    r += ( i % base ) / denom;
    i = Math.floor( i / base );
  }

  return r;
}
