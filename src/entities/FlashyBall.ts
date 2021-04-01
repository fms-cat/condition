import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Lambda } from '../heck/components/Lambda';
import { Material } from '../heck/Material';
import { Mesh } from '../heck/components/Mesh';
import { Quaternion, Vector3 } from '@fms-cat/experimental';
import { auto } from '../globals/automaton';
import { dummyRenderTarget, dummyRenderTargetFourDrawBuffers } from '../globals/dummyRenderTarget';
import { genOctahedron } from '../geometries/genOctahedron';
import { objectValuesMap } from '../utils/objectEntriesMap';
import { quadGeometry } from '../globals/quadGeometry';
import depthFrag from '../shaders/depth.frag';
import flashyBallFrag from '../shaders/flashy-ball.frag';
import flashyBallVert from '../shaders/flashy-ball.vert';

export class FlashyBall extends Entity {
  public mesh: Mesh;

  public constructor() {
    super();

    // -- geometry ---------------------------------------------------------------------------------
    const octahedron = genOctahedron( { div: 5 } );

    const geometry = new Geometry();

    geometry.vao.bindVertexbuffer( octahedron.position, 0, 3 );
    geometry.vao.bindVertexbuffer( octahedron.normal, 1, 3 );
    geometry.vao.bindIndexbuffer( octahedron.index );

    geometry.count = octahedron.count;
    geometry.mode = octahedron.mode;
    geometry.indexType = octahedron.indexType;

    // -- materials --------------------------------------------------------------------------------
    const deferred = new Material(
      flashyBallVert,
      flashyBallFrag,
      {
        defines: [ 'DEFERRED 1' ],
        initOptions: { geometry: quadGeometry, target: dummyRenderTargetFourDrawBuffers },
      },
    );

    const depth = new Material(
      flashyBallVert,
      depthFrag,
      { initOptions: { geometry: quadGeometry, target: dummyRenderTarget } },
    );

    const materials = { deferred, depth };

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept(
          [
            '../shaders/flashy-ball.vert',
            '../shaders/flashy-ball.frag',
          ],
          () => {
            deferred.replaceShader( flashyBallVert, flashyBallFrag );
            depth.replaceShader( flashyBallVert, depthFrag );
          },
        );
      }
    }

    // -- mesh -------------------------------------------------------------------------------------
    this.mesh = new Mesh( {
      geometry,
      materials,
      name: process.env.DEV && 'FlashyBall/mesh',
    } );
    this.components.push( this.mesh );

    // -- speen ------------------------------------------------------------------------------------
    const axis = new Vector3( [ 1.0, -1.0, 1.0 ] ).normalized;
    this.components.push( new Lambda( {
      onUpdate: ( { time } ) => {
        this.transform.rotation = Quaternion.fromAxisAngle( axis, time );
        objectValuesMap( materials, ( material ) => {
          material.addUniform(
            'distort',
            '1f',
            auto( 'FlashyBall/distortAmp' )
          );
        } );
      },
      name: process.env.DEV && 'FlashyBall/update',
    } ) );
  }
}
