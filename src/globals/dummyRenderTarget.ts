import { BufferRenderTarget } from '../heck/BufferRenderTarget';

export const dummyRenderTarget = new BufferRenderTarget( {
  width: 1,
  height: 1,
  name: process.env.DEV && 'dummyRenderTarget',
} );

export const dummyRenderTargetTwoDrawBuffers = new BufferRenderTarget( {
  width: 1,
  height: 1,
  numBuffers: 2,
  name: process.env.DEV && 'dummyRenderTargetTwoDrawBuffers',
} );


export const dummyRenderTargetFourDrawBuffers = new BufferRenderTarget( {
  width: 1,
  height: 1,
  numBuffers: 4,
  name: process.env.DEV && 'dummyRenderTargetFourDrawBuffers',
} );
