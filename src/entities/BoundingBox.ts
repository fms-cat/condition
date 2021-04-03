import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { dummyRenderTarget } from '../globals/dummyRenderTarget';
import { gl, glCat } from '../globals/canvas';
import boundingBoxFrag from '../shaders/bounding-box.frag';
import boundingBoxVert from '../shaders/bounding-box.vert';

export class BoundingBox extends Entity {
  public constructor() {
    super();

    // -- create buffers ---------------------------------------------------------------------------
    const arrayPos = [
      -1, -1, -1,
      1, -1, -1,
      -1, 1, -1,
      1, 1, -1,
      -1, -1, 1,
      1, -1, 1,
      -1, 1, 1,
      1, 1, 1,
    ];
    const arrayInd = [
      0, 1,
      0, 2,
      0, 4,
      1, 3,
      1, 5,
      2, 3,
      2, 6,
      3, 7,
      4, 5,
      4, 6,
      5, 7,
      6, 7,
    ];

    const bufferPos = glCat.createBuffer();
    bufferPos.setVertexbuffer( new Float32Array( arrayPos ) );

    const bufferInd = glCat.createBuffer();
    bufferInd.setIndexbuffer( new Uint16Array( arrayInd ) );

    // -- create geometry --------------------------------------------------------------------------
    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( bufferPos, 0, 3 );
    geometry.vao.bindIndexbuffer( bufferInd );

    geometry.count = 24;
    geometry.mode = gl.LINES;
    geometry.indexType = gl.UNSIGNED_SHORT;

    // -- create materials -------------------------------------------------------------------------
    const forward = new Material(
      boundingBoxVert,
      boundingBoxFrag,
      {
        defines: [ 'FORWARD 1' ],
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    const depth = new Material(
      boundingBoxVert,
      boundingBoxFrag,
      {
        defines: [ 'SHADOW 1' ],
        initOptions: { geometry, target: dummyRenderTarget },
      },
    );

    const materials = { forward, cubemap: forward, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/bounding-box.vert',
            '../shaders/bounding-box.frag',
          ],
          () => {
            forward.replaceShader( boundingBoxVert, boundingBoxFrag );
            depth.replaceShader( boundingBoxVert, boundingBoxFrag );
          },
        );
      }
    }

    // -- create meshes ----------------------------------------------------------------------------
    const mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'mesh',
    } );
    this.components.push( mesh );
  }
}
