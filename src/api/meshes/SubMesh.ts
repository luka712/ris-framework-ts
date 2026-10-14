import type { IMesh } from "./IMesh.ts";
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
        public readonly parent: IMesh,
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

    /** Draws this submesh with its material. */
    public render(): void {
        this.material.beforeRender();
        this.material.renderMesh(this);
    }

    /** Does nothing: the buffers belong to the parent and the material to the caller. */
    public dispose(): void {
    }
}
