const { getOptions } = require( 'loader-utils' );
const { AutomatonWithGUI } = require( '@fms-cat/automaton-with-gui' );

/**
 * @param {string} content
 */
module.exports = function( content ) {
  const options = getOptions( this );

  let data = JSON.parse( content );

  if ( options.minimize ) {
    data = AutomatonWithGUI.minimizeData( data, { ...options } );
  }

  return `module.exports = ${ JSON.stringify( data ) }`;
};
