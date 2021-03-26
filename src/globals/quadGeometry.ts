import { Geometry } from '../heck/Geometry';
import { TRIANGLE_STRIP_QUAD } from '@fms-cat/experimental';
import { gl, glCat } from './canvas';

const quadBuffer = glCat.createBuffer();
quadBuffer.setVertexbuffer( new Float32Array( TRIANGLE_STRIP_QUAD ) );

export const quadGeometry = new Geometry();
quadGeometry.vao.bindVertexbuffer( quadBuffer, 0, 2 );

quadGeometry.count = 4;
quadGeometry.mode = gl.TRIANGLE_STRIP;
