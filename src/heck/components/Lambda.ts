import { Component, ComponentDrawEvent, ComponentOptions, ComponentUpdateEvent } from './Component';

export interface LambdaOptions extends ComponentOptions {
  onUpdate?: ( event: ComponentUpdateEvent ) => void;
  onDraw?: ( event: ComponentDrawEvent ) => void;
}

export class Lambda extends Component {
  public onUpdate?: ( event: ComponentUpdateEvent ) => void;
  public onDraw?: ( event: ComponentDrawEvent ) => void;

  public constructor( options?: LambdaOptions ) {
    super( options );

    const { onUpdate, onDraw } = options ?? {};

    this.onUpdate = onUpdate;
    this.active = onUpdate != null;

    this.onDraw = onDraw;
    this.visible = onDraw != null;
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void {
    this.onUpdate && this.onUpdate( event );
  }

  protected __drawImpl( event: ComponentDrawEvent ): void {
    this.onDraw && this.onDraw( event );
  }
}
