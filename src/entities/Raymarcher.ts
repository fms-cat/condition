import { Mesh, MeshCull } from '../heck/components/Mesh';
import { TRIANGLE_STRIP_QUAD, Vector3 } from '@fms-cat/experimental';
import { gl, glCat } from '../globals/canvas';
import { Entity } from '../heck/Entity';
import { Geometry } from '../heck/Geometry';
import { Material, MaterialMap } from '../heck/Material';
import quadVert from '../shaders/quad.vert';
import raymarcherFrag from '../shaders/raymarcher.frag';
import { Lambda } from '../heck/components/Lambda';
import { randomTexture, randomTextureStatic } from '../globals/randomTexture';
import { auto } from '../globals/automaton';

export class Raymarcher {
  public materials: MaterialMap<'deferred' | 'shadow'>;
  public mesh: Mesh;
  public geometry: Geometry;
  public readonly entity: Entity;

  public constructor() {
    this.entity = new Entity();
    this.entity.transform.position = new Vector3( [ 0.0, 0.0, 0.3 ] );
    this.entity.transform.scale = new Vector3( [ 16.0, 9.0, 1.0 ] ).scale( 0.15 );

    this.geometry = this.__createGeoemtry();
    this.materials = this.__createMaterials();

    for ( const material of Object.values( this.materials ) ) {
      material.addUniform( 'range', '4f', -1.0, -1.0, 1.0, 1.0 );

      material.addUniformTexture( 'samplerRandom', randomTexture.texture );
      material.addUniformTexture( 'samplerRandomStatic', randomTextureStatic.texture );
    }

    this.entity.components.push( new Lambda( {
      onDraw: ( event ) => {
        for ( const material of Object.values( this.materials ) ) {
          material.addUniform(
            'cameraNearFar',
            '2f',
            event.camera.near,
            event.camera.far
          );

          material.addUniformVector(
            'inversePV',
            'Matrix4fv',
            event.projectionMatrix.multiply( event.viewMatrix ).inverse!.elements
          );

          material.addUniform( 'deformAmp', '1f', auto( 'Music/NEURO_WUB_AMP' ) );
          material.addUniform( 'deformFreq', '1f', auto( 'Music/NEURO_WUB_FREQ' ) );
          material.addUniform( 'deformTime', '1f', auto( 'Music/NEURO_TIME' ) );
        }
      },
      active: false,
      name: process.env.DEV && 'Raymarcher/updater',
    } ) );

    this.mesh = new Mesh( {
      geometry: this.geometry,
      materials: this.materials,
      name: process.env.DEV && 'Raymarcher/mesh',
    } );
    this.mesh.cull = MeshCull.None;
    this.entity.components.push( this.mesh );
  }

  protected __createGeoemtry(): Geometry {
    const geometry = new Geometry();

    const bufferPos = glCat.createBuffer();
    bufferPos.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD ) );
    geometry.addAttribute( 'p', {
      buffer: bufferPos,
      size: 2,
      type: gl.FLOAT
    } );

    geometry.count = 4;
    geometry.mode = gl.TRIANGLE_STRIP;

    return geometry;
  }

  protected __createMaterials(): MaterialMap<'deferred' | 'shadow'> {
    const deferred = new Material( quadVert, raymarcherFrag, { defines: { 'DEFERRED': 'true' } } );
    const shadow = new Material( quadVert, raymarcherFrag, { defines: { 'SHADOW': 'true' } } );

    if ( process.env.DEV ) {
      if ( module.hot ) {
        module.hot.accept( '../shaders/raymarcher.frag', () => {
          deferred.replaceShader( quadVert, raymarcherFrag );
          shadow.replaceShader( quadVert, raymarcherFrag );
        } );
      }
    }

    return { deferred, shadow };
  }
}
