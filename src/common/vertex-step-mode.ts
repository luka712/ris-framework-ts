export enum VertexStepMode {

    /**
     * The vertex buffer is stepped through once per vertex. This is the default step mode.
     */
    Vertex = 0,

    /**
     * The vertex buffer is stepped through once per instance. This is used for instanced rendering.
     */
    Instance = 1,
}