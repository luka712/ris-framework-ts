/**
 * The current state of a resource, such as a texture.
 *     This enum is used to track the lifecycle of resources and ensure that they are properly initialized and disposed of.
 */
export enum State {
  CREATED = 0,
  INITIALIZED = 1,
  DISPOSING = 2,
  DISPOSED = 3
}
