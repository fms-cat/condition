import { GLCatTexture } from '@fms-cat/glcat-ts';
import { gl, glCat } from '../globals/canvas';

export function createSVGTableTexture( pathStr: string, width = 1024 ): GLCatTexture {
  const svgNamespaceURI = 'http://www.w3.org/2000/svg';
  const path = document.createElementNS( svgNamespaceURI, 'path' );
  path.setAttribute( 'd', pathStr );

  const pathLength = path.getTotalLength();
  const eps = 0.25 / width * pathLength;

  const table = new Float32Array( 4 * width ); // x, y, dx, dy

  for ( let i = 0; i < width; i ++ ) {
    const phase = ( ( i + 0.5 ) / width ) * pathLength;

    const point = path.getPointAtLength( phase );

    const pointdn = path.getPointAtLength( phase - eps );
    const pointdp = path.getPointAtLength( phase + eps );

    const dx = pointdp.x - pointdn.x;
    const dy = pointdp.y - pointdn.y;
    const dl = Math.sqrt( dx * dx + dy * dy );

    table[ 4 * i + 0 ] = point.x;
    table[ 4 * i + 1 ] = point.y;
    table[ 4 * i + 2 ] = dx / dl;
    table[ 4 * i + 3 ] = dy / dl;
  }

  const texture = glCat.createTexture();
  texture.setTextureFromArray(
    width,
    1,
    table,
    { internalformat: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT },
  );
  texture.textureWrap( gl.REPEAT );

  return texture;
}
