function getElement<T extends HTMLElement>(
  id: string,
  tagName: string,
  style: { [ key: string ]: string },
  hook?: ( el: T ) => void,
): T {
  let el = document.getElementById( id ) as T;
  if ( el ) {
    return el;
  }

  el = document.createElement( tagName ) as T;
  el.id = id;

  document.body.appendChild( el );

  Object.assign( el.style, style );

  hook?.( el );

  return el;
}

export function getCheckboxActive(): HTMLInputElement {
  return getElement<HTMLInputElement>(
    'checkboxActive',
    'input',
    {
      position: 'fixed',
      left: '8px',
      bottom: '248px',
    },
    ( el ) => {
      el.type = 'checkbox';
      el.checked = true;
    },
  );
}

export function getDivCanvasContainer(): HTMLDivElement {
  return getElement<HTMLDivElement>(
    'divCanvasContainer',
    'div',
    {
      position: 'fixed',
      width: 'calc( 100% - 420px )',
      height: 'calc( 100% - 240px )',
      left: '0',
      top: '0',
      display: 'flex',
    },
  );
}

export function getDivAutomaton(): HTMLDivElement {
  return getElement<HTMLDivElement>(
    'divAutomaton',
    'div',
    {
      position: 'fixed',
      width: '100%',
      height: '240px',
      right: '0',
      bottom: '0',
    },
  );
}

export function getDivComponentsUpdate(): HTMLDivElement {
  return getElement<HTMLDivElement>(
    'divComponentsUpdate',
    'div',
    {
      whiteSpace: 'pre',
      color: '#ffffff',
      font: '500 10px Wt-Position-Mono',
      position: 'fixed',
      padding: '0',
      boxSizing: 'border-box',
      width: '420px',
      height: 'calc( ( 100% - 240px ) * 0.5 )',
      right: '0',
      top: '0',
      overflowY: 'scroll',
    },
  );
}

export function getDivComponentsDraw(): HTMLDivElement {
  return getElement<HTMLDivElement>(
    'divComponentsDraw',
    'div',
    {
      whiteSpace: 'pre',
      color: '#ffffff',
      font: '500 10px Wt-Position-Mono',
      position: 'fixed',
      padding: '0',
      boxSizing: 'border-box',
      width: '420px',
      height: 'calc( ( 100% - 240px ) * 0.5 )',
      right: '0',
      top: 'calc( ( 100% - 240px ) * 0.5 )',
      overflowY: 'scroll',
    },
  );
}
