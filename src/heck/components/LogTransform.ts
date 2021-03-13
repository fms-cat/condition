import { Component, ComponentOptions, ComponentUpdateEvent } from './Component';

export class LogTransform extends Component {
  public constructor( options?: ComponentOptions ) {
    super( options );

    this.visible = false;
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void {
    console.info( `
Position: ${ event.globalTransform.position }
Rotation: ${ event.globalTransform.rotation }
Scale: ${ event.globalTransform.scale }
Matrix: ${ event.globalTransform.matrix }
` );
  }
}
