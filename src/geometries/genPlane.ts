import { GLCatBuffer } from '@fms-cat/glcat-ts';
import { gl, glCat } from '../globals/canvas';

interface ResultGenPlane {
  position: GLCatBuffer;
  index: GLCatBuffer;
  count: number;
  mode: GLenum;
  indexType: GLenum;
}

export function genPlane( options?: {
  segment?: number;
} ): ResultGenPlane {
  const segment = options?.segment ?? 33;
  const segmentMinusOne = segment - 1;

  const pos: number[] = [];
  const ind: number[] = [];

  for ( let iY = 0; iY < segmentMinusOne; iY ++ ) {
    const y = iY / segmentMinusOne * 2.0 - 1.0;

    for ( let iX = 0; iX < segmentMinusOne; iX ++ ) {
      const x = iX / segmentMinusOne * 2.0 - 1.0;
      const i = iX + iY * segment;

      pos.push( x, y, 0 );
      ind.push(
        i, i + 1, i + segment + 1,
        i, i + segment + 1, i + segment,
      );
    }
    pos.push( 1, y, 0 );
  }

  for ( let iX = 0; iX < segment; iX ++ ) {
    const x = iX / segmentMinusOne * 2.0 - 1.0;

    pos.push( x, 1, 0 );
  }

  const position = glCat.createBuffer();
  position.setVertexbuffer( new Float32Array( pos ) );

  const index = glCat.createBuffer();
  index.setIndexbuffer( new Uint32Array( ind ) );

  return {
    position,
    index,
    count: ind.length,
    mode: gl.TRIANGLES,
    indexType: gl.UNSIGNED_INT,
  };
}
