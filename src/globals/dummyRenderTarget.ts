import { BufferRenderTarget } from '../heck/BufferRenderTarget';

export const dummyRenderTargetOneDrawBuffers = new BufferRenderTarget( {
  width: 1,
  height: 1,
  numBuffers: 4,
  name: process.env.DEV && 'dummyRenderTargetOneDrawBuffers',
} );

export const dummyRenderTargetFourDrawBuffers = new BufferRenderTarget( {
  width: 1,
  height: 1,
  numBuffers: 4,
  name: process.env.DEV && 'dummyRenderTargetFourDrawBuffers',
} );
