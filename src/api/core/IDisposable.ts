/** A resource that holds memory or native objects and must be disposed. */
export interface IDisposable {

    /** Disposes the resource immediately and releases its memory. */
    dispose(): void;
}
