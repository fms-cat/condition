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

    this.onUpdate = options?.onUpdate;
    this.onDraw = options?.onDraw;
  }

  protected __updateImpl( event: ComponentUpdateEvent ): void {
    this.onUpdate && this.onUpdate( event );
  }

  protected __drawImpl( event: ComponentDrawEvent ): void {
    this.onDraw && this.onDraw( event );
  }
}
