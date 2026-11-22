/**
 * The culling mode.
 */
export enum CullMode {
/**
 * The culling is disabled. Both front and back faces will be rendered.
 */
  NONE = 0,
/**
 * The back faces will be culled. Only front faces will be rendered.
 */
  BACK = 1,
/**
 * The front faces will be culled. Only back faces will be rendered.
 */
  FRONT = 2
}
