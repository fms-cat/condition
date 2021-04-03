import { BufferRenderTarget } from './heck/BufferRenderTarget';
import { Component } from './heck/components/Component';
import { MUSIC_BPM, START_POSITION } from './config';
import { automaton } from './globals/automaton';
import { canvas } from './globals/canvas';
import { dog } from './scene';
import { getCheckboxActive, getDivCanvasContainer } from './globals/dom';
import { music } from './globals/music';
import type { AutomatonWithGUI } from '@fms-cat/automaton-with-gui';

// == dom ==========================================================================================
document.body.style.margin = '0';
document.body.style.padding = '0';

if ( process.env.DEV ) {
  document.body.style.background = '#000';
  document.body.style.width = '100%';

  const divCanvasContainer = getDivCanvasContainer();

  divCanvasContainer.appendChild( canvas );
  ( canvas.style as any ).aspectRatio = 'auto 1920 / 1080';
  canvas.style.margin = 'auto';
  canvas.style.maxWidth = '100%';
  canvas.style.maxHeight = '100%';
} else {
  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';
  document.body.style.width = canvas.style.width = '100%';
  document.body.style.height = canvas.style.height = '100%';
}

// -- keyboards ------------------------------------------------------------------------------------
if ( process.env.DEV ) {
  const checkboxActive = getCheckboxActive();

  window.addEventListener( 'keydown', ( event ) => {
    if ( event.key === 'Escape' ) { // panic button
      dog.root.active = false;
      music.isPlaying = false;
      checkboxActive.checked = false;
    } else if ( event.key === ' ' ) {
      ( automaton as AutomatonWithGUI ).togglePlay();
    } else if ( event.key === 'ArrowLeft' ) {
      music.time -= 480.0 / MUSIC_BPM;
      automaton.reset();
    } else if ( event.key === 'ArrowRight' ) {
      music.time += 480.0 / MUSIC_BPM;
      automaton.reset();
    }
  } );

  checkboxActive.addEventListener( 'input', ( event: any ) => {
    dog.root.active = event.target.checked;
    music.isPlaying = event.target.checked;
  } );
}

// -- wenis ----------------------------------------------------------------------------------------
if ( process.env.DEV ) {
  console.info( Component.nameMap );
  console.info( BufferRenderTarget.nameMap );
}

// -- let's gooooo ---------------------------------------------------------------------------------
async function load(): Promise<void> {
  if ( process.env.DEV ) {
    music.time = START_POSITION;
    ( automaton as AutomatonWithGUI ).play();
  }

  if ( !process.env.DEV ) {
    document.body.innerHTML = '';
    document.write( 'Wait a moment...' );
  }

  await music.prepare();

  if ( !process.env.DEV ) {
    document.body.innerHTML = '';

    const button = document.createElement( 'a' );
    document.body.prepend( button );
    button.innerHTML = 'click me!';

    button.onclick = () => {
      document.body.prepend( canvas );
      music.isPlaying = true;
      document.body.requestFullscreen();
    };

    window.addEventListener( 'keydown', ( event ) => {
      if ( event.key === 'Escape' ) { // panic button
        dog.root.active = false;
        music.isPlaying = false;
      }
    } );
  }
}
load();
