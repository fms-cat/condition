const { getOptions } = require( 'loader-utils' );
const cp = require( 'child_process' );
const tempy = require( 'tempy' );
const path = require( 'path' );
const fs = require( 'fs' );
const { promisify } = require( 'util' );

const exec = promisify( cp.exec );

/**
 * @param {object} options
 * @returns {string}
 */
function buildMinifierOptionsString( options ) {
  let str = '';

  if ( options.hlsl ) {
    str += '--hlsl ';
  }

  str += '--format none ';

  if ( typeof options.fieldNames === 'string' ) {
    str += `--field-names ${ options.fieldNames } `;
  }

  if ( options.preserveExternals ) {
    str += '--preserve-externals ';
  }

  if ( options.preserveAllGlobals ) {
    str += '--preserve-all-globals ';
  }

  if ( options.noRenaming ) {
    str += '--no-renaming ';
  }

  if ( Array.isArray( options.noRenamingList ) ) {
    str += `--no-renaming-list ${ options.noRenamingList.join( ',' ) } `;
  }

  if ( options.noSequence ) {
    str += '--no-sequence ';
  }

  if ( options.smoothstep ) {
    str += '--smoothstep ';
  }

  return str;
}

/**
 * @param {string} content
 * @returns string
 */
function sanitizeContent( content ) {
  return content.split( '\n' ).map( ( line ) => {
    let lineSanitized = line;

    // precision
    // https://github.com/laurentlb/Shader_Minifier/issues/8
    if ( /^\s*precision/m.exec( lineSanitized ) ) {
      lineSanitized = `//[\n${ lineSanitized }\n//]`
    }

    return lineSanitized;
  } ).join( '\n' );
}

/**
 * @param {string} content
 */
module.exports = async function( content ) {
  const callback = this.async();
  const options = getOptions( this );

  const minifierOptions = buildMinifierOptionsString( options );

  const name = path.basename( this.resourcePath );

  const contentSanitized = sanitizeContent( content );

  const minified = await tempy.file.task( async ( pathOriginal ) => {
    await fs.promises.writeFile( pathOriginal, contentSanitized, { encoding: 'utf8' } );

    return await tempy.file.task( async ( pathMinified ) => {
      const command = `shader_minifier.exe ${ pathOriginal } ${ minifierOptions }-o ${ pathMinified }`;
      await exec( command ).catch( ( error ) => {
        if ( error.stdout ) {
          this.emitError( Error( error.stdout ) );
        }

        throw error;
      } );

      return await fs.promises.readFile( pathMinified, { encoding: 'utf8' } );
    }, { name } );
  }, { name } ).catch( ( error ) => {
    callback( error );
  } );

  if ( minified ) {
    callback( null, minified );
  }
};
