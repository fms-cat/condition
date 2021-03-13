export abstract class RenderTarget {
  public abstract get width(): number;

  public abstract get height(): number;

  public abstract bind(): void;
}
