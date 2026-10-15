/**
 * The mesh is a building class for a world shape.
 */
import {mat4, quat, vec3} from "gl-matrix";
import {State} from "../data/State.ts";
import type {IVertexBuffer} from "../rendering/buffers/IVertexBuffer.ts";
import type {IIndexBuffer} from "../rendering/buffers/IIndexBuffer.ts";
import type {IUniformBuffer} from "../rendering/buffers/IUniformBuffer.ts";
import type {IFramework} from "../IFramework.ts";
import type {IMesh} from "./IMesh.ts";
import {BufferUsage} from "../rendering/buffers/BufferUsage.ts";
import type {IGeometry} from "../geometry/IGeometry.ts";
import {MeshParameters} from "./MeshParameters.ts";
import {GeometryUtilities} from "../utilities/GeometryUtilities.ts";
import type {IMaterial} from "../material/IMaterial.ts";
import type {GeometryFormat} from "../geometry/GeometryFormat.ts";
import {SubMesh} from "./SubMesh.ts";
import type {Scene} from "../scene/Scene.ts";

/**
 * The mesh.
 */
export class Mesh implements IMesh {

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
    protected _subMeshes: SubMesh[] = [];
    private readonly _modelMatrix = mat4.create();
    private readonly _rotationQuat = quat.create();
    // Cached copies to detect in-place edits; NaN forces the first computation.
    private readonly _lastPosition = vec3.fromValues(NaN, NaN, NaN);
    private readonly _lastRotation = vec3.create();
    private readonly _lastScale = vec3.create();
    private _modelBuffer?: IUniformBuffer;
    /** The matrix last uploaded to the model buffer. */
    private readonly _uploadedMatrix = mat4.create();

    /** @inheritDoc */
    public position: vec3 = vec3.create();

    /** @inheritDoc */
    public rotation: vec3 = vec3.create();

    /** @inheritDoc */
    public scale: vec3 = vec3.fromValues(1, 1, 1);

    /** @inheritDoc */
    public get modelMatrix(): mat4 {
        if (!vec3.exactEquals(this._lastPosition, this.position)
            || !vec3.exactEquals(this._lastRotation, this.rotation)
            || !vec3.exactEquals(this._lastScale, this.scale)) {
            vec3.copy(this._lastPosition, this.position);
            vec3.copy(this._lastRotation, this.rotation);
            vec3.copy(this._lastScale, this.scale);
            const q = quat.identity(this._rotationQuat);
            quat.rotateY(q, q, this.rotation[1]);
            quat.rotateX(q, q, this.rotation[0]);
            quat.rotateZ(q, q, this.rotation[2]);
            mat4.fromRotationTranslationScale(this._modelMatrix, q, this.position, this.scale);
        }
        return this._modelMatrix;
    }

    /** @inheritDoc Created on first access and disposed with the mesh. */
    public get modelBuffer(): IUniformBuffer {
        if (!this._modelBuffer) {
            mat4.copy(this._uploadedMatrix, this.modelMatrix);
            this._modelBuffer = this._framework.bufferFactory.createUniformBuffer(
                this._uploadedMatrix, BufferUsage.UNIFORM | BufferUsage.COPY_DST, "Mesh.modelBuffer");
        }
        return this._modelBuffer;
    }

    /** Uploads the model matrix when the transform changed since the last upload. */
    private _updateModelBuffer(): IUniformBuffer {
        const buffer = this.modelBuffer;
        const matrix = this.modelMatrix;
        if (!mat4.exactEquals(this._uploadedMatrix, matrix)) {
            mat4.copy(this._uploadedMatrix, matrix);
            buffer.update(this._uploadedMatrix);
        }
        return buffer;
    }

    /**
     * Assigns this mesh's model buffer to a material that uses one (has a `modelBuffer` property),
     * only when it differs. Materials without one (e.g. sprites) are skipped and no buffer is created for them.
     * @internal
     */
    __assignModelBuffer(material: IMaterial): void {
        if (!("modelBuffer" in material)) {
            return;
        }
        const buffer = this._updateModelBuffer();
        if (material.modelBuffer !== buffer) {
            material.modelBuffer = buffer;
        }
    }

    /**
     * The constructor.
     * @param _framework The framework.
     * @param scene The scene. The mesh adds itself to it and removes itself on dispose.
     *              `null` only for internal meshes drawn outside a scene (e.g. the sprite batch).
     * @param _material The material. Optional for a mesh that only holds submeshes.
     */
    public constructor(protected readonly _framework: IFramework, public readonly scene: Scene | null, protected _material?: IMaterial) {
        scene?.add(this);
    }

    /** The material. Undefined for a mesh drawn through its submeshes. */
    public get material(): IMaterial | undefined {
        return this._material;
    }

    /** Sets the material. */
    public set material(material: IMaterial | undefined) {
        this._material = material;
    }

    /** The submeshes. They share this mesh's vertex and index buffers. */
    public get subMeshes(): SubMesh[] {
        return this._subMeshes;
    }

    /**
     * Adds a submesh that draws a range of this mesh's index buffer with its own material.
     * @param material The material of the submesh.
     * @param indexStart The first index of the range.
     * @param indexCount The number of indices in the range.
     * @returns The submesh.
     */
    public addSubMesh(material: IMaterial, indexStart: number, indexCount: number): SubMesh {
        const subMesh = new SubMesh(this, material, indexStart, indexCount);
        this._subMeshes.push(subMesh);
        return subMesh;
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
     * The index buffer.
     */
    public get indexBuffer(): IIndexBuffer | undefined {
        return this._indexBuffer;
    }

    /**
     * Initializes the mesh.
     */
    public initialize(): void {
        this.applyChanges();
    }

    private _fillColors(index: { vertexDataIndex: number, colorIndex: number }, colors: number[]): void {

        if (!this._vertexData) {
            throw new Error("Vertex data is not initialized");
        }

        let v = index.vertexDataIndex;
        let c = index.colorIndex;

        if (colors.length > index.colorIndex) {
            this._vertexData[v++] = colors[c++];
            this._vertexData[v++] = colors[c++];
            this._vertexData[v++] = colors[c++];
            this._vertexData[v++] = colors[c++];
            index.vertexDataIndex = v;
        } else {
            // Just prefill with white color
            this._vertexData[v++] = 1;
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
    public applyChanges() {
        if (!this._positions || this._positions.length == 0) {
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

        for (let i = 0; i < vertexCount; i++) {
            // Positions.
            this._vertexData[vertexIndex++] = this._positions[positionsIndex++];
            this._vertexData[vertexIndex++] = this._positions[positionsIndex++];
            this._vertexData[vertexIndex++] = this._positions[positionsIndex++];

            // Colors.
            if (this._colors) {
                const index = {vertexDataIndex: vertexIndex, colorIndex: colorIndex};
                this._fillColors(index, this._colors);
                vertexIndex = index.vertexDataIndex;
                colorIndex = index.colorIndex;
            }

            if (this._textureCoords) {
                // Uvs.
                this._vertexData[vertexIndex++] = this._textureCoords[uvsIndex++];
                this._vertexData[vertexIndex++] = this._textureCoords[uvsIndex++];
            }

            if (this._normals) {
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
        if (this._indices && this._indices.length > 0) {
            this._indexBuffer = this._framework.bufferFactory.createIndexBuffer(
                this._indices);
        }
    }

    /**
     * Sets the mesh from a geometry.
     *
     * This will create vertex buffer and index buffer from geometry.
     * @param geometry - The geometry.
     * @param geometryFormat - The vertex layout. Defaults to the material's geometry format.
     */
    public setGeometry(geometry: IGeometry, geometryFormat?: GeometryFormat): void {

        const format = geometryFormat ?? this._material?.geometryFormat;
        if (format === undefined) {
            throw new Error("Cannot create buffers for a Mesh without a material or geometry format.");
        }
        if (geometry.vertexCount == 0) {
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
        if (geometry.indices) {
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

    /** @inheritDoc */
    public render(): void {

        // Render submeshes.
        if (this.subMeshes?.length > 0) {
            for (let i = 0; i < this.subMeshes.length; ++i) {
                this.subMeshes[i].render();
            }
        }

        if (this.material) {
            this.__assignModelBuffer(this.material);
            this.material.beforeRender();
            this.material.renderMesh(this);
        }
    }

    /**
     * Dispose of the mesh.
     */
    public dispose(): void {
        this.scene?.remove(this);
        this._subMeshes.length = 0;
        this._vertexBuffer?.dispose();
        this._vertexBuffer = undefined;
        this._indexBuffer?.dispose();
        this._indexBuffer = undefined;
        this._modelBuffer?.dispose();
        this._modelBuffer = undefined;
    }
}
