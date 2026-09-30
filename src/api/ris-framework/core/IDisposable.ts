/**
 * Interface that should be called to correctly dispose of instance.
 */
export interface IDisposable {

    /**
     * Disposes the resource and release memory if resources allocated memory.
     */
    dispose() : void;
}