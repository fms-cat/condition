/**
 * Assuming the first line is #version...
 * @param code The original shader code
 * @param inject The code you want to inject
 */
export function injectCodeToShader( code: string, inject: string ): string {
  const lines = code.split( '\n' );
  lines.splice( 1, 0, inject );
  return lines.join( '\n' );
}
