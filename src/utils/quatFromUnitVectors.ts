import { Quaternion, Vector3 } from '@fms-cat/experimental';

// https://github.com/mrdoob/three.js/blob/94f043c4e105eb73236529231388402da2b07cba/src/math/Quaternion.js#L362
export function quatFromUnitVectors( a: Vector3, b: Vector3 ): Quaternion {
  const r = a.dot( b ) + 1.0;

  if ( r < 1E-4 ) {
    if ( Math.abs( a.x ) > Math.abs( a.z ) ) {
      return new Quaternion( [ -a.y, a.x, 0.0, r ] ).normalized;
    } else {
      return new Quaternion( [ 0.0, -a.z, a.y, r ] ).normalized;
    }
  } else {
    return new Quaternion( [
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x,
      r,
    ] ).normalized;
  }
}
