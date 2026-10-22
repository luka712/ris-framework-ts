import type { mat4, vec3 } from "gl-matrix";
import type { IMesh } from "./IMesh.ts";
import type { Mesh } from "./Mesh.ts";
import type { IUniformBuffer } from "../rendering/buffers/IUniformBuffer.ts";
import type { IMaterial } from "../material/IMaterial.ts";
import type { IVertexBuffer } from "../rendering/buffers/IVertexBuffer.ts";
import type { IIndexBuffer } from "../rendering/buffers/IIndexBuffer.ts";

/**
 * A part of a mesh drawn with its own material.
 * It shares the parent's vertex and index buffers and draws only its index range.
 */
export class SubMesh implements IMesh {

    /**
     * The constructor.
     * @param parent The mesh that owns the buffers.
     * @param material The material of this submesh.
     * @param indexStart The first index of the range.
     * @param indexCount The number of indices in the range.
     */
    public constructor(
        public readonly parent: Mesh,
        public material: IMaterial,
        public readonly indexStart: number,
        public readonly indexCount: number) {
    }

    /** The parent's vertex buffer. */
    public get vertexBuffer(): IVertexBuffer | undefined {
        return this.parent.vertexBuffer;
    }

    /** The parent's index buffer. */
    public get indexBuffer(): IIndexBuffer | undefined {
        return this.parent.indexBuffer;
    }

    /** The parent's position; setting it sets the parent's. */
    public get position(): vec3 { return this.parent.position; }
    public set position(value: vec3) { this.parent.position = value; }

    /** The parent's rotation; setting it sets the parent's. */
    public get rotation(): vec3 { return this.parent.rotation; }
    public set rotation(value: vec3) { this.parent.rotation = value; }

    /** The parent's scale; setting it sets the parent's. */
    public get scale(): vec3 { return this.parent.scale; }
    public set scale(value: vec3) { this.parent.scale = value; }

    /** The parent's model matrix. */
    public get modelMatrix(): mat4 {
        return this.parent.modelMatrix;
    }

    /** The parent's model buffer. */
    public get modelBuffer(): IUniformBuffer {
        return this.parent.modelBuffer;
    }

    /** Draws this submesh with its material, using the parent's transform (model buffer). */
    public render(): void {
        this.parent.__assignModelBuffer(this.material);
        this.material.beforeRender();
        this.material.renderMesh(this);
    }

    /** Does nothing: the buffers belong to the parent and the material to the caller. */
    public dispose(): void {
    }
}
