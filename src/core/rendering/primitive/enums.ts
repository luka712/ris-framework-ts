/**
 * The culling mode.
 */
export enum CullMode
{
    /**
    * The culling is disabled. Both front and back faces will be rendered.
    */
    NONE,

    /**
    * The back faces will be culled. Only front faces will be rendered.
    */
    BACK,

    /**
    * The front faces will be culled. Only back faces will be rendered.
    */
    FRONT
}

/**
* The front face winding order.
*/
export enum FrontFace
{
    /**
    * The clockwise winding order.
    */
    CW,

    /**
    * The counter-clockwise winding order.
    */
    CCW,
}


/**
* The primitive topology.
*/
export enum PrimitiveTopology
{
    /**
    * Each consecutive pair of two vertices defines a line primitive.
    */
    LINE_LIST,

    /**
    * Each vertex after the first defines a line primitive between it and the previous vertex.
    */
    LINE_STRIP,

    /**
    * Each vertex defines a point primitive.
    */
    POINT_LIST,

    /**
    * Each consecutive triplet of three vertices defines a triangle primitive.
    */
    TRIANGLE_LIST,

    /**
    * Each vertex after the first two defines a triangle primitive between it and the previous two vertices.
    */
    TRIANGLE_STRIP,
}