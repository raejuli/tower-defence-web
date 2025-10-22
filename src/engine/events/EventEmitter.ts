/**
 * Generic Event Emitter
 */

export type EventCallback<T = any> = (data: T) => void;

export class EventEmitter {
  private _listeners: Map<string, EventCallback[]> = new Map();

  public on(event: string, callback: EventCallback): void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: EventCallback): void {
    const listeners = this._listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  public emit(event: string, data?: any): void {
    const listeners = this._listeners.get(event);
    console.log(`EventEmitter: emit('${event}')`, 'listeners:', listeners?.length || 0, 'data:', data);
    if (listeners) {
      for (const callback of listeners) {
        callback(data);
      }
    }
  }

  public clear(): void {
    this._listeners.clear();
  }
}
