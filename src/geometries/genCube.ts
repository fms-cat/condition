import { GLCatBuffer } from '@fms-cat/glcat-ts';
import { gl, glCat } from '../globals/canvas';

interface ResultGenCube {
  position: GLCatBuffer;
  normal: GLCatBuffer;
  index: GLCatBuffer;
  count: number;
  mode: GLenum;
}

export function genCube(): ResultGenCube {
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
    let func = ( v: number[] ) => {
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

    pos.push( ...p.map( func ).flat() );
    nor.push( ...n.map( func ).flat() );
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
    mode: gl.TRIANGLES
  };
}
