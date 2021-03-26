import { GLCatProgram, GLCatProgramLinkOptions, GLCatProgramUniformType, GLCatTexture, GLCatTextureCubemap } from '@fms-cat/glcat-ts';
import { gl, glCat } from '../globals/canvas';
import { injectCodeToShader } from '../utils/injectCodeToShader';
import { Geometry } from './Geometry';
import { RenderTarget } from './RenderTarget';
import { SHADERPOOL } from './ShaderPool';

export type MaterialTag =
  | 'deferred'
  | 'forward'
  | 'depth';

export type MaterialMap<T extends MaterialTag = MaterialTag> = { [ tag in T ]: Material };

export interface MaterialInitOptions {
  target: RenderTarget;
  geometry: Geometry;
}

export class Material {
  protected __linkOptions: GLCatProgramLinkOptions;

  protected __defines: string[];

  protected __uniforms: {
    [ name: string ]: {
      type: GLCatProgramUniformType;
      value: number[];
    };
  } = {};

  protected __uniformVectors: {
    [ name: string ]: {
      type: GLCatProgramUniformType;
      value: Float32List | Int32List;
    };
  } = {};

  protected __uniformTextures: {
    [ name: string ]: {
      texture: GLCatTexture | null;
    };
  } = {};

  protected __uniformCubemaps: {
    [ name: string ]: {
      texture: GLCatTextureCubemap | null;
    };
  } = {};

  private __vert: string;

  public get vert(): string {
    return this.__vert;
  }

  public get vertWithDefines(): string {
    return this.__withDefines( this.vert );
  }

  private __frag: string;

  public get frag(): string {
    return this.__frag;
  }

  public get fragWithDefines(): string {
    return this.__withDefines( this.frag );
  }

  public get program(): GLCatProgram {
    return SHADERPOOL.getProgram(
      this,
      this.vertWithDefines,
      this.fragWithDefines,
    );
  }

  public blend: [ GLenum, GLenum ];

  public constructor(
    vert: string,
    frag: string,
    { defines, blend, linkOptions, initOptions }: {
      defines?: string[],
      blend?: [ GLenum, GLenum ],
      linkOptions?: GLCatProgramLinkOptions,
      initOptions?: MaterialInitOptions,
    } = {},
  ) {
    this.__vert = vert;
    this.__frag = frag;
    this.__linkOptions = linkOptions ?? {};
    this.__defines = defines ?? [];
    this.blend = blend ?? [ gl.ONE, gl.ZERO ];

    if ( initOptions ) {
      this.d3dSucks( initOptions );
    } else {
      if ( process.env.DEV ) {
        console.warn( 'Material created without initOptions' );
      }
    }
  }

  public addUniform( name: string, type: GLCatProgramUniformType, ...value: number[] ): void {
    this.__uniforms[ name ] = { type, value };
  }

  public addUniformVector(
    name: string,
    type: GLCatProgramUniformType,
    value: Float32List | Int32List
  ): void {
    this.__uniformVectors[ name ] = { type, value };
  }

  public addUniformTexture( name: string, texture: GLCatTexture | null ): void {
    this.__uniformTextures[ name ] = { texture };
  }

  public addUniformCubemap( name: string, texture: GLCatTextureCubemap | null ): void {
    this.__uniformCubemaps[ name ] = { texture };
  }

  public setUniforms(): void {
    const program = this.program;

    Object.entries( this.__uniforms ).forEach( ( [ name, { type, value } ] ) => {
      program.uniform( name, type, ...value );
    } );

    Object.entries( this.__uniformVectors ).forEach( ( [ name, { type, value } ] ) => {
      program.uniformVector( name, type, value );
    } );

    Object.entries( this.__uniformTextures ).forEach( ( [ name, { texture } ] ) => {
      program.uniformTexture( name, texture );
    } );

    Object.entries( this.__uniformCubemaps ).forEach( ( [ name, { texture } ] ) => {
      program.uniformCubemap( name, texture );
    } );
  }

  public setBlendMode(): void {
    gl.blendFunc( ...this.blend );
  }

  public async replaceShader(
    vert: string,
    frag: string,
    options?: {
      defines?: string[],
      linkOptions?: GLCatProgramLinkOptions,
    },
  ): Promise<void> {
    if ( options?.defines ) {
      this.__defines = [ ...options.defines ];
    }

    const program = await SHADERPOOL.getProgramAsync(
      this,
      this.__withDefines( vert ),
      this.__withDefines( frag ),
      options?.linkOptions,
    ).catch( ( e ) => {
      console.error( e );
    } );

    if ( program ) {
      const prevVert = this.vertWithDefines;
      const prevFrag = this.fragWithDefines;

      this.__vert = vert;
      this.__frag = frag;

      SHADERPOOL.discardProgram( this, prevVert, prevFrag );
    }
  }

  /**
   * https://scrapbox.io/fms-cat/WebGL:_%E3%82%B7%E3%82%A7%E3%83%BC%E3%83%80%E3%81%AE%E3%82%B3%E3%83%B3%E3%83%91%E3%82%A4%E3%83%AB%E3%81%8C%E9%81%85%E3%81%84
   */
  public d3dSucks( { geometry, target }: MaterialInitOptions ): void {
    target.bind();
    glCat.useProgram( this.program, () => {
      geometry.drawElementsOrArrays();
    } );
  }

  protected __withDefines( code: string ): string {
    let inject = '';

    this.__defines.map( ( value ) => {
      if ( value != null ) {
        inject += `#define ${value}\n`;
      }
    } );

    return injectCodeToShader( code, inject );
  }
}
