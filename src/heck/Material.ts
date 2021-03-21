import { GLCatProgram, GLCatProgramLinkOptions, GLCatProgramUniformType, GLCatTexture, GLCatTextureCubemap } from '@fms-cat/glcat-ts';
import { gl } from '../globals/canvas';
import { injectCodeToShader } from '../utils/injectCodeToShader';
import { SHADERPOOL } from './ShaderPool';

export type MaterialTag =
  | 'deferred'
  | 'forward'
  | 'shadow';

export type MaterialMap<T extends MaterialTag = MaterialTag> = { [ tag in T ]: Material };

export class Material {
  protected __linkOptions: GLCatProgramLinkOptions;

  protected __defines: {
    [ name: string ]: ( string | undefined );
  };

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

  public blend: [ GLenum, GLenum ] = [ gl.ONE, gl.ZERO ];

  public constructor(
    vert: string,
    frag: string,
    options?: {
      defines?: { [ key: string ]: ( string | undefined ) },
      linkOptions?: GLCatProgramLinkOptions,
    },
  ) {
    this.__vert = vert;
    this.__frag = frag;
    this.__linkOptions = options?.linkOptions ?? {};
    this.__defines = options?.defines ?? {};
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
      defines?: { [ key: string ]: ( string | undefined ) },
      linkOptions?: GLCatProgramLinkOptions,
    },
  ): Promise<void> {
    if ( options?.defines ) {
      this.__defines = { ...options.defines };
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

  protected __withDefines( code: string ): string {
    let inject = '';

    Object.entries( this.__defines ).map( ( [ key, value ] ) => {
      if ( value != null ) {
        inject += `#define ${key} ${value}\n`;
      }
    } );

    return injectCodeToShader( code, inject );
  }
}
