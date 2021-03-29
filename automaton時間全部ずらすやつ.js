/**
 * @type {import('../automaton/node_modules/@fms-cat/automaton/types').SerializedAutomaton}
 */
const data = require( './src/automaton.json' );

const newData = JSON.parse( JSON.stringify( data ) );

const bpm = 180.0;
const beat = 60.0 / bpm;

const shift = 16.0 * beat;

newData.channels.forEach( ( [ name, channel ] ) => {
  channel.items.forEach( ( item ) => {
    item.time += shift;
  } );
} );

console.log( JSON.stringify( newData ) );
