import GLCat, { GLCatBuffer } from '@fms-cat/glcat-ts';
import { gl, glCat } from '../globals/canvas';

interface ResultGenTorus {
  position: GLCatBuffer;
  normal: GLCatBuffer;
  index: GLCatBuffer;
  count: number;
  mode: GLenum;
  indexType: GLenum;
}

export function genTorus( options?: {
  radiusRadial?: number;
  radiusTubular?: number;
  segmentsRadial?: number;
  segmentsTubular?: number;
} ): ResultGenTorus {
  const radiusRadial = options?.radiusRadial ?? 1;
  const radiusTubular = options?.radiusTubular ?? 0; // WHOA
  const segmentsRadial = options?.segmentsRadial ?? 64;
  const segmentsTubular = options?.segmentsTubular ?? 4;

  const pos = [];
  const nor = [];
  const ind = [];

  for ( let iRad = 0; iRad < segmentsRadial; iRad ++ ) {
    const iRadn = ( iRad + 1 ) % segmentsRadial;
    const tRad = 2.0 * Math.PI * iRad / segmentsRadial;
    const xRad = Math.cos( tRad );
    const yRad = Math.sin( tRad );

    for ( let iTub = 0; iTub < segmentsTubular; iTub ++ ) {
      const iTubn = ( iTub + 1 ) % segmentsTubular;
      const tTub = 2.0 * Math.PI * iTub / segmentsTubular;
      const xTub = Math.cos( tTub );
      const yTub = Math.sin( tTub );

      const nx = xRad * xTub;
      const ny = yTub;
      const nz = yRad * xTub;

      pos.push(
        radiusRadial * xRad + radiusTubular * nx,
        0.0 + radiusTubular * ny,
        radiusRadial * yRad + radiusTubular * nz
      );
      nor.push( nx, ny, nz );
      ind.push(
        segmentsTubular * iRad + iTub,
        segmentsTubular * iRad + iTubn,
        segmentsTubular * iRadn + iTubn,
        segmentsTubular * iRad + iTub,
        segmentsTubular * iRadn + iTubn,
        segmentsTubular * iRadn + iTub,
      );
    }
  }

  const position = glCat.createBuffer();
  position.setVertexbuffer( new Float32Array( pos ) );

  const normal = glCat.createBuffer();
  normal.setVertexbuffer( new Float32Array( nor ) );

  const index = glCat.createBuffer();
  index.setIndexbuffer( new Uint16Array( ind ) );

  return {
    position,
    normal,
    index,
    count: ind.length,
    mode: gl.TRIANGLES,
    indexType: gl.UNSIGNED_SHORT,
  };
}
