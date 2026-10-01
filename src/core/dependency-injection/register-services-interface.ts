import type { DependencyContainer } from "tsyringe";

export const IFrameworkSymbol = Symbol.for("IFramework");

/**
 * The interface for registering services to the dependency injection container.
 */
export interface IRegisterServices {

    /**
     * Register all services to the dependency injection container in this method.
     * @param container The dependency injection container to register services to.
     */
    register(container: DependencyContainer): void;
}
