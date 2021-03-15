import { canvas } from './globals/canvas';
import { BufferRenderTarget } from './heck/BufferRenderTarget';
import { Component } from './heck/components/Component';
import { music } from './globals/music';
import { getCheckboxActive } from './globals/dom';
import { dog } from './scene';

// == music ========================================================================================
if ( process.env.DEV ) {
  music.isPlaying = true;
}

// == dom ==========================================================================================
document.body.style.margin = '0';
document.body.style.padding = '0';

if ( process.env.DEV ) {
  document.body.style.background = '#000';
  document.body.style.width = '100%';

  document.body.appendChild( canvas );
  canvas.style.left = '0';
  canvas.style.top = '0';
  canvas.style.width = 'calc( 100% - 240px )';
} else {
  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';
  document.body.style.width = canvas.style.width = '100%';
  document.body.style.height = canvas.style.height = '100%';

  const button = document.createElement( 'a' );
  document.body.appendChild( button );
  button.innerHTML = 'click me!';

  button.onclick = () => {
    document.body.appendChild( canvas );
    music.isPlaying = true;
    document.body.requestFullscreen();
  };
}

// -- keyboards ------------------------------------------------------------------------------------
if ( process.env.DEV ) {
  const checkboxActive = getCheckboxActive();

  window.addEventListener( 'keydown', ( event ) => {
    if ( event.key === 'Escape' ) { // panic button
      dog.root.active = false;
      music.isPlaying = false;
      checkboxActive.checked = false;
    }
  } );

  checkboxActive.addEventListener( 'input', ( event: any ) => {
    dog.root.active = event.target.checked;
    music.isPlaying = event.target.checked;
  } );
}

if ( !process.env.DEV ) {
  window.addEventListener( 'keydown', ( event ) => {
    if ( event.key === 'Escape' ) { // panic button
      dog.root.active = false;
      music.isPlaying = false;
    }
  } );
}

// -- wenis ----------------------------------------------------------------------------------------
if ( process.env.DEV ) {
  console.info( Component.nameMap );
  console.info( BufferRenderTarget.nameMap );
}
