/**
 * The mesh is a building class for a world shape.
 */
import {State} from "../data/State";
import {IVertexBuffer} from "../rendering/buffers/IVertexBuffer";
import {IIndexBuffer} from "../rendering/buffers/IIndexBuffer";
import {IFramework} from "../IFramework";
import {IMesh} from "./IMesh";
import {BufferUsage} from "../rendering/buffers/BufferUsage";
import {IGeometry} from "../geometry/IGeometry";
import {GeometryFormat} from "../geometry/GeometryFormat";
import {MeshParameters} from "./MeshParameters";
import {GeometryUtilities} from "../utilities/GeometryUtilities";

/**
 * The mesh.
 */
export class Mesh implements IMesh {

    protected readonly _framework: IFramework;
    protected _bufferUsage = BufferUsage.VERTEX;
    protected _state = State.CREATED;
    protected _vertexData?: number[];
    protected _positions?: number[];
    protected _indices?: number[];
    protected _colors?: number[];
    protected _textureCoords?: number[];
    protected _normals?: number[];
    protected _vertexBuffer?: IVertexBuffer;
    protected _indexBuffer?: IIndexBuffer;

    /**
     * The constructor.
     * @param framework The framework.
     */
    public constructor(framework: IFramework) {
        this._framework = framework;
    }

    /**
     * The state of a mesh.
     */
    public get state(): State {
        return this._state;
    }

    /**
     * The positions of a mesh.
     */
    public get positions(): number[] | undefined {
        return this._positions;
    }

    /**
     * The indices of a mesh.
     */
    public get indices(): number[] | undefined {
        return this._indices;
    }

    /**
     * The colors of a mesh.
     */
    public get colors(): number[] | undefined {
        return this._colors;
    }

    /**
     * UV texture coordinates of a mesh.
     */
    public get textureCoords(): number[] | undefined {
        return this._textureCoords;
    }

    /**
     * The normals of a mesh.
     */
    public get normals(): number[] | undefined {
        return this._normals;
    }

    /**
     * The vertex buffer.
     */
    public get vertexBuffer(): IVertexBuffer | undefined {
        return this._vertexBuffer;
    }

    /**
     * The idex buffer.
     */
    public get indexBuffer(): IIndexBuffer | undefined {
        return this._indexBuffer ;
    }

    /**
     * Initializes the mesh.
     */
    public initialize(): void {
        this.applyChanges();
    }

    private _fillColors(index: {vertexDataIndex: number, colorIndex: number}, colors: number[]): void {

        if(!this._vertexData) {
            throw new Error("Vertex data is not initialized");
        }

        let v = index.vertexDataIndex;
        let c = index.colorIndex;

        if(colors.length > index.colorIndex) {
            this._vertexData[v++] = colors[c++];
            this._vertexData[v++] = colors[c++];
            this._vertexData[v++] = colors[c++];
            this._vertexData[v++] = colors[c++];
            index.vertexDataIndex = v;
        }
        else {
            // Just prefill with white color
            this._vertexData[v++] =1;
            this._vertexData[v++] = 1;
            this._vertexData[v++] = 1;
            this._vertexData[v++] = 1;
        }

        index.vertexDataIndex = v;
        index.colorIndex = c;
    }

    /**
     * Apply changes to the mesh.
     */
    public applyChanges()
    {
        if (!this._positions ||this._positions.length == 0)
        {
            //_framework.Logger.LogWarning("Cannot create buffers for a Mesh as Mesh has no positions.");
            throw new Error(`Cannot create buffers for a Mesh as Mesh has no positions`);
        }

        // - POSITIONS
        const vertexCount = this._positions.length / 3;

        // 3 for vertex, 4 for color and 2 for uvs.
        const stride = (3 + 4 + 2) * Float32Array.BYTES_PER_ELEMENT;
        this._vertexData = new Array((3 + 4 + 2) * vertexCount);

        let vertexIndex = 0;
        let positionsIndex = 0;
        let colorIndex = 0;
        let normalIndex = 0;
        let uvsIndex = 0;

        for (let i = 0; i < vertexCount; i++)
        {
            // Positions.
            this._vertexData[vertexIndex++] = this._positions[positionsIndex++];
            this._vertexData[vertexIndex++] = this._positions[positionsIndex++];
            this._vertexData[vertexIndex++] = this._positions[positionsIndex++];

            // Colors.
            if (this._colors)
            {
                const index = {vertexDataIndex: vertexIndex, colorIndex: colorIndex};
                this._fillColors(index, this._colors);
                vertexIndex = index.vertexDataIndex;
                colorIndex = index.colorIndex;
            }

            if (this._textureCoords)
            {
                // Uvs.
                this._vertexData[vertexIndex++] = this._textureCoords[uvsIndex++];
                this._vertexData[vertexIndex++] = this._textureCoords[uvsIndex++];
            }

            if (this._normals)
            {
                this._vertexData[vertexIndex++] = this._normals[normalIndex++];
                this._vertexData[vertexIndex++] = this._normals[normalIndex++];
                this._vertexData[vertexIndex++] = this._normals[normalIndex++];
            }
        }

        // Vertices
        this._vertexBuffer?.dispose();
        this._vertexBuffer = this._framework.bufferFactory.createVertexBuffer(
                this._vertexData, stride, this._bufferUsage);

        // Indices
        this._indexBuffer?.dispose();
        if (this._indices && this._indices.length > 0)
        {
            this._indexBuffer= this._framework.bufferFactory.createIndexBuffer(
                this._indices);
        }
    }

    /**
     * Sets the mesh from a geometry.
     *
     * This will create vertex buffer and index buffer from geometry.
     * Positions, Colors, TextureCoordinates  and Normals will be ignored.
     * @param geometry - The geometry.
     * @param format - The format for geometry.
     */
    public setGeometry(geometry: IGeometry, format: GeometryFormat): void {
        if (geometry.vertexCount == 0)
        {
            const message =
            "Cannot create buffers for a Mesh as Mesh has no positions. Check that geometry.vertexCount is set.";
            //_framework.Logger.LogError(message);
            throw new Error(message);
        }

        const interleavedData = geometry.toInterleaved(format);
        const stride = GeometryUtilities.stride(format);

        // Vertices
        this._vertexBuffer?.dispose();
        this._vertexBuffer = this._framework.bufferFactory.createVertexBuffer(
            interleavedData,
            stride,
            this._bufferUsage);

        // Indices
        this._indexBuffer?.dispose();
        if (geometry.indices)
        {
            this._indexBuffer = this._framework.bufferFactory.createIndexBuffer(geometry.indices);
        }
    }

    /**
     * Sets the mesh from parameters.
     * @param meshParameters - The parameters.
     */
    public setMesh(meshParameters: MeshParameters): void {
        this._positions = meshParameters.positions;
        this._indices = meshParameters.indices;
        this._textureCoords = meshParameters.textureCoords;
        this._colors = meshParameters.colors;
        this.applyChanges();
    }

    /**
     * Dispose of the mesh.
     */
    public dispose(): void {
        this._vertexBuffer?.dispose();
        this._vertexBuffer = undefined;
        this._indexBuffer?.dispose();
        this._indexBuffer = undefined;
    }
}
