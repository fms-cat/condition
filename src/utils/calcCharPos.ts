const canvas = document.createElement( 'canvas' );
const context = canvas.getContext( '2d' )!;

export function calcCharPos(
  text: string,
  font: string,
): {
    totalWidth: number;
    chars: {
      char: string;
      x: number;
    }[];
  } {
  let totalWidth = 0;
  let currentText = '';

  context.font = font;

  const chars = text.split( '' ).map( ( char ) => {
    const charWidth = context.measureText( char ).width;

    currentText += char;
    totalWidth = context.measureText( currentText ).width;
    const x = totalWidth - 0.5 * charWidth;

    return { x, char };
  } );

  return { totalWidth, chars };
}
