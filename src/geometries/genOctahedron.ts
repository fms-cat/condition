import { GeometryAttribute, GeometryIndex } from '../heck/Geometry';
import { DISPLAY } from '../heck/DISPLAY';

interface ResultGenOctahedron {
  position: GeometryAttribute;
  normal: GeometryAttribute;
  index: GeometryIndex;
  count: number;
  mode: GLenum;
}

export function genOctahedron( options: {
  radius?: number;
  div?: number;
} = {} ): ResultGenOctahedron {
  const radius = options.radius ?? 1.0;
  const div = options.div ?? 1;

  const pos = [];
  const nor = [];
  const ind = [];

  for ( let ii = 0; ii < 2; ii ++ ) { // side
    for ( let ip = 0; ip < 4; ip ++ ) { // plane
      for ( let iy = 0; iy < div + 1; iy ++ ) {
        for ( let ix = 0; ix < iy + 1; ix ++ ) {
          const lat0 = ( ii * 2.0 + iy / ( div + 1 ) ) * Math.PI / 2.0;
          const lat1 = ( ii * 2.0 + ( iy + 1 ) / ( div + 1 ) ) * Math.PI / 2.0;

          const lon0 = ( ii * 2.0 - 1.0 ) * ( ( ix - 1 ) / Math.max( 1, iy ) + ip ) * Math.PI / 2.0;
          const lon1 = ( ii * 2.0 - 1.0 ) * ( ix / ( iy + 1 ) + ip ) * Math.PI / 2.0;
          const lon2 = ( ii * 2.0 - 1.0 ) * ( ix / Math.max( 1, iy ) + ip ) * Math.PI / 2.0;
          const lon3 = ( ii * 2.0 - 1.0 ) * ( ( ix + 1 ) / ( iy + 1 ) + ip ) * Math.PI / 2.0;

          if ( ix !== 0 ) {
            ind.push(
              pos.length / 3,
              pos.length / 3 + 1,
              pos.length / 3 + 2
            );

            const x1 = radius * Math.sin( lat0 ) * Math.cos( lon0 );
            const y1 = radius * Math.cos( lat0 );
            const z1 = radius * Math.sin( lat0 ) * Math.sin( lon0 );

            const x2 = radius * Math.sin( lat1 ) * Math.cos( lon1 );
            const y2 = radius * Math.cos( lat1 );
            const z2 = radius * Math.sin( lat1 ) * Math.sin( lon1 );

            const x3 = radius * Math.sin( lat0 ) * Math.cos( lon2 );
            const y3 = radius * Math.cos( lat0 );
            const z3 = radius * Math.sin( lat0 ) * Math.sin( lon2 );

            pos.push(
              x1, y1, z1,
              x2, y2, z2,
              x3, y3, z3
            );

            {
              const x = x1 + x2 + x3;
              const y = y1 + y2 + y3;
              const z = z1 + z2 + z3;
              const l = Math.sqrt( x * x + y * y + z * z );

              for ( let i = 0; i < 3; i ++ ) {
                nor.push(
                  x / l,
                  y / l,
                  z / l
                );
              }
            }
          }

          {
            ind.push(
              pos.length / 3,
              pos.length / 3 + 1,
              pos.length / 3 + 2
            );

            const x1 = radius * Math.sin( lat0 ) * Math.cos( lon2 );
            const y1 = radius * Math.cos( lat0 );
            const z1 = radius * Math.sin( lat0 ) * Math.sin( lon2 );

            const x2 = radius * Math.sin( lat1 ) * Math.cos( lon1 );
            const y2 = radius * Math.cos( lat1 );
            const z2 = radius * Math.sin( lat1 ) * Math.sin( lon1 );

            const x3 = radius * Math.sin( lat1 ) * Math.cos( lon3 );
            const y3 = radius * Math.cos( lat1 );
            const z3 = radius * Math.sin( lat1 ) * Math.sin( lon3 );

            pos.push(
              x1, y1, z1,
              x2, y2, z2,
              x3, y3, z3
            );

            {
              const x = x1 + x2 + x3;
              const y = y1 + y2 + y3;
              const z = z1 + z2 + z3;
              const l = Math.sqrt( x * x + y * y + z * z );

              for ( let i = 0; i < 3; i ++ ) {
                nor.push(
                  x / l,
                  y / l,
                  z / l
                );
              }
            }
          }
        }
      }
    }
  }

  const position: GeometryAttribute = {
    buffer: DISPLAY.glCat.createBuffer(),
    type: DISPLAY.gl.FLOAT,
    size: 3
  };
  position.buffer.setVertexbuffer( new Float32Array( pos ) );

  const normal: GeometryAttribute = {
    buffer: DISPLAY.glCat.createBuffer(),
    type: DISPLAY.gl.FLOAT,
    size: 3
  };
  normal.buffer.setVertexbuffer( new Float32Array( nor ) );

  const index: GeometryIndex = {
    buffer: DISPLAY.glCat.createBuffer(),
    type: DISPLAY.gl.UNSIGNED_SHORT
  };
  index.buffer.setIndexbuffer( new Uint16Array( ind ) );

  return {
    position,
    normal,
    index,
    count: ind.length,
    mode: DISPLAY.gl.TRIANGLES
  };
}
