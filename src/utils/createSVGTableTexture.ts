import { GLCatTexture } from '@fms-cat/glcat-ts';
import { gl, glCat } from '../globals/canvas';

export function createSVGTableTexture( pathStrs: string[], width = 1024 ): GLCatTexture {
  const table: number[] = []; // x, y, dx, dy

  pathStrs.map( ( pathStr ) => {
    const svgNamespaceURI = 'http://www.w3.org/2000/svg';
    const path = document.createElementNS( svgNamespaceURI, 'path' );
    path.setAttribute( 'd', pathStr );

    const pathLength = path.getTotalLength();
    const eps = 0.25 / width * pathLength;

    for ( let i = 0; i < width; i ++ ) {
      const phase = ( ( i + 0.5 ) / width ) * pathLength;

      const point = path.getPointAtLength( phase );

      const pointdn = path.getPointAtLength( phase - eps );
      const pointdp = path.getPointAtLength( phase + eps );

      const dx = pointdp.x - pointdn.x;
      const dy = pointdp.y - pointdn.y;
      const dl = Math.sqrt( dx * dx + dy * dy );

      table.push( point.x, point.y, dx / dl, dy / dl );
    }
  } );

  const texture = glCat.createTexture();
  texture.setTextureFromArray(
    width,
    pathStrs.length,
    new Float32Array( table ),
    { internalformat: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT },
  );
  texture.textureWrap( gl.REPEAT );

  return texture;
}
