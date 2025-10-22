/**
 * Base UI View Class
 */

export abstract class UIView {
  protected _container: HTMLElement;
  protected _isVisible: boolean = false;

  constructor() {
    this._container = this._createContainer();
    this._container.style.display = 'none';
  }

  protected abstract _createContainer(): HTMLElement;

  public abstract render(): void;

  public show(): void {
    this._isVisible = true;
    this._container.style.display = 'block';
    this.render();
  }

  public hide(): void {
    this._isVisible = false;
    this._container.style.display = 'none';
  }

  public isVisible(): boolean {
    return this._isVisible;
  }

  public getContainer(): HTMLElement {
    return this._container;
  }

  public destroy(): void {
    if (this._container.parentElement) {
      this._container.parentElement.removeChild(this._container);
    }
  }
}
