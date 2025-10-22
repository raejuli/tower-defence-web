/**
 * Service Locator Pattern
 * Provides global access to core services without tight coupling
 */

export class ServiceLocator {
  private static _services: Map<string, any> = new Map();

  public static register<T>(serviceName: string, service: T): void {
    if (this._services.has(serviceName)) {
      console.warn(`ServiceLocator: Service '${serviceName}' is already registered. Overwriting.`);
    }
    this._services.set(serviceName, service);
  }

  public static get<T>(serviceName: string): T {
    const service = this._services.get(serviceName);
    if (!service) {
      throw new Error(`ServiceLocator: Service '${serviceName}' not found. Did you forget to register it?`);
    }
    return service as T;
  }

  public static has(serviceName: string): boolean {
    return this._services.has(serviceName);
  }

  public static unregister(serviceName: string): void {
    this._services.delete(serviceName);
  }

  public static clear(): void {
    this._services.clear();
  }
}
