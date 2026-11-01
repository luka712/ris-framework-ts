import {mat4, quat, vec3} from "gl-matrix";
import {Mesh} from "./Mesh.ts";
import type {IRenderableMesh} from "./IRenderableMesh.ts";
import type {IFramework} from "../IFramework.ts";
import type {IMaterial} from "../material/IMaterial.ts";
import type {IUniformBuffer} from "../rendering/buffers/IUniformBuffer.ts";
import type {IVertexBuffer} from "../rendering/buffers/IVertexBuffer.ts";
import type {IIndexBuffer} from "../rendering/buffers/IIndexBuffer.ts";
import type {GeometryFormat} from "../geometry/GeometryFormat.ts";
import {BufferUsage} from "../rendering/buffers/BufferUsage.ts";

/**
 * A mesh that can be drawn (C# `RenderableMesh`). See {@link IRenderableMesh}.
 *
 * - Root: `new RenderableMesh(framework, material?)` owns the vertex and index buffers, the transform and the model buffer.
 * - Sub mesh: `new RenderableMesh(framework, material, parent, indexStart, indexCount)` (or `parent.addSubMesh(...)`)
 *   shares the parent's buffers, transform and model buffer, and only stores its index range.
 * @public
 */
export class RenderableMesh extends Mesh implements IRenderableMesh {

    private readonly _subMeshes: RenderableMesh[] = [];
    private readonly _parent?: RenderableMesh;

    // Transform; only used on the root.
    private _position: vec3 = vec3.create();
    private _rotation: vec3 = vec3.create();
    private _scale: vec3 = vec3.fromValues(1, 1, 1);
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
    public material?: IMaterial;

    /** @inheritDoc */
    public readonly indexStart: number;

    /** @inheritDoc */
    public readonly indexCount: number;

    /**
     * The constructor.
     * @param framework The framework.
     * @param material The material. Optional for a root mesh drawn only through its sub meshes.
     * @param parent The parent, for a sub mesh. A sub mesh shares the parent's buffers and transform and is added to `parent.subMeshes`.
     * @param indexStart The first index of the range. Defaults to 0.
     * @param indexCount The number of indices of the range. -1 (default) draws all indices.
     */
    public constructor(framework: IFramework, material?: IMaterial, parent?: RenderableMesh, indexStart = 0, indexCount = -1) {
        super(framework);
        this.material = material;
        this._parent = parent;
        this.indexStart = indexStart;
        this.indexCount = indexCount;
        parent?._subMeshes.push(this);
    }

    /** The root mesh: the one owning the buffers and the transform. */
    private get _root(): RenderableMesh {
        return this._parent ? this._parent._root : this;
    }

    /** @inheritDoc */
    public get parent(): RenderableMesh | undefined {
        return this._parent;
    }

    /** @inheritDoc */
    public get subMeshes(): readonly RenderableMesh[] {
        return this._subMeshes;
    }

    /**
     * Adds a sub mesh that draws a range of this mesh's index buffer with its own material.
     * @param material The material of the sub mesh.
     * @param indexStart The first index of the range.
     * @param indexCount The number of indices in the range; -1 draws all.
     * @returns The sub mesh.
     */
    public addSubMesh(material: IMaterial | undefined, indexStart: number, indexCount: number): RenderableMesh {
        return new RenderableMesh(this._framework, material, this, indexStart, indexCount);
    }

    /** The parent's vertex buffer for a sub mesh, else its own. */
    public override get vertexBuffer(): IVertexBuffer | undefined {
        return this._parent ? this._parent.vertexBuffer : this._vertexBuffer;
    }

    /** The parent's index buffer for a sub mesh, else its own. */
    public override get indexBuffer(): IIndexBuffer | undefined {
        return this._parent ? this._parent.indexBuffer : this._indexBuffer;
    }

    /** The material's geometry format. */
    protected override get _defaultGeometryFormat(): GeometryFormat | undefined {
        return this.material?.geometryFormat;
    }

    /** @inheritDoc */
    public get position(): vec3 { return this._root._position; }
    public set position(value: vec3) { this._root._position = value; }

    /** @inheritDoc */
    public get rotation(): vec3 { return this._root._rotation; }
    public set rotation(value: vec3) { this._root._rotation = value; }

    /** @inheritDoc */
    public get scale(): vec3 { return this._root._scale; }
    public set scale(value: vec3) { this._root._scale = value; }

    /** @inheritDoc */
    public get modelMatrix(): mat4 {
        const root = this._root;
        if (root !== this) {
            return root.modelMatrix;
        }
        if (!vec3.exactEquals(this._lastPosition, this._position)
            || !vec3.exactEquals(this._lastRotation, this._rotation)
            || !vec3.exactEquals(this._lastScale, this._scale)) {
            vec3.copy(this._lastPosition, this._position);
            vec3.copy(this._lastRotation, this._rotation);
            vec3.copy(this._lastScale, this._scale);
            const q = quat.identity(this._rotationQuat);
            quat.rotateY(q, q, this._rotation[1]);
            quat.rotateX(q, q, this._rotation[0]);
            quat.rotateZ(q, q, this._rotation[2]);
            mat4.fromRotationTranslationScale(this._modelMatrix, q, this._position, this._scale);
        }
        return this._modelMatrix;
    }

    /** @inheritDoc Created on first access and disposed with the root mesh. */
    public get modelBuffer(): IUniformBuffer {
        const root = this._root;
        if (root !== this) {
            return root.modelBuffer;
        }
        if (!this._modelBuffer) {
            mat4.copy(this._uploadedMatrix, this.modelMatrix);
            this._modelBuffer = this._framework.bufferFactory.createUniformBuffer(
                this._uploadedMatrix, BufferUsage.UNIFORM | BufferUsage.COPY_DST, "RenderableMesh.modelBuffer");
        }
        return this._modelBuffer;
    }

    /** Uploads the root's model matrix when the transform changed since the last upload. */
    private _updateModelBuffer(): IUniformBuffer {
        const root = this._root;
        const buffer = root.modelBuffer;
        const matrix = root.modelMatrix;
        if (!mat4.exactEquals(root._uploadedMatrix, matrix)) {
            mat4.copy(root._uploadedMatrix, matrix);
            buffer.update(root._uploadedMatrix);
        }
        return buffer;
    }

    /**
     * Assigns the model buffer to a material that uses one (has a `modelBuffer` property), only when it differs.
     * Materials without one (e.g. sprites) are skipped and no buffer is created for them.
     */
    private _assignModelBuffer(material: IMaterial): void {
        if (!("modelBuffer" in material)) {
            return;
        }
        const buffer = this._updateModelBuffer();
        if (material.modelBuffer !== buffer) {
            material.modelBuffer = buffer;
        }
    }

    /** @inheritDoc */
    public render(): void {
        if (this.material) {
            this._assignModelBuffer(this.material);
            this.material.beforeRender();
            this.material.renderMesh(this);
        }
        for (const subMesh of this._subMeshes) {
            subMesh.render();
        }
    }

    /**
     * Disposes the sub meshes, then (for a root) the vertex, index and model buffers, once.
     * A sub mesh never disposes the shared buffers. Materials are not disposed.
     */
    public override dispose(): void {
        for (const subMesh of this._subMeshes) {
            subMesh.dispose();
        }
        this._subMeshes.length = 0;
        if (this._parent) {
            return;
        }
        super.dispose();
        this._modelBuffer?.dispose();
        this._modelBuffer = undefined;
    }
}
