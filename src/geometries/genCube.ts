import { GLCatBuffer } from '@fms-cat/glcat-ts';
import { gl, glCat } from '../globals/canvas';

interface ResultGenCube {
  position: GLCatBuffer;
  normal: GLCatBuffer;
  index: GLCatBuffer;
  count: number;
  mode: GLenum;
  indexType: GLenum;
}

export function genCube( options?: {
  dimension?: [ number, number, number ]
} ): ResultGenCube {
  const dimension = options?.dimension ?? [ 1, 1, 1 ];

  const pos: number[] = [];
  const nor: number[] = [];
  const ind: number[] = [];

  const p = [
    [ -1, -1,  1 ],
    [  1, -1,  1 ],
    [ -1,  1,  1 ],
    [  1,  1,  1 ],
  ];
  const n = [
    [ 0, 0, 1 ],
    [ 0, 0, 1 ],
    [ 0, 0, 1 ],
    [ 0, 0, 1 ],
  ];

  for ( let i = 0; i < 6; i ++ ) {
    const rotate = ( v: number[] ): number[] => {
      const vt: number[] = [];

      if ( i < 4 ) {
        const t = i * Math.PI / 2.0;
        vt[ 0 ] = Math.cos( t ) * v[ 0 ] - Math.sin( t ) * v[ 2 ];
        vt[ 1 ] = v[ 1 ];
        vt[ 2 ] = Math.sin( t ) * v[ 0 ] + Math.cos( t ) * v[ 2 ];
      } else {
        const t = ( i - 0.5 ) * Math.PI;
        vt[ 0 ] = v[ 0 ];
        vt[ 1 ] = Math.cos( t ) * v[ 1 ] - Math.sin( t ) * v[ 2 ];
        vt[ 2 ] = Math.sin( t ) * v[ 1 ] + Math.cos( t ) * v[ 2 ];
      }

      return vt;
    };

    const scale = ( v: number[] ): number[] => {
      return [
        v[ 0 ] * dimension[ 0 ],
        v[ 1 ] * dimension[ 1 ],
        v[ 2 ] * dimension[ 2 ],
      ];
    };

    pos.push( ...p.map( rotate ).map( scale ).flat() );
    nor.push( ...n.map( rotate ).flat() );
    ind.push( ...[ 0, 1, 3, 0, 3, 2 ].map( ( v ) => v + 4 * i ) );
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
