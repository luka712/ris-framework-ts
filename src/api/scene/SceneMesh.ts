import type {IDisposable} from "../core/IDisposable.ts";
import type {IRenderableMesh} from "../meshes/IRenderableMesh.ts";
import type {IMaterial} from "../material/IMaterial.ts";

/**
 * A renderable mesh held by a scene (C# `SceneMesh`): `new SceneMesh(renderableMesh)`.
 * It covers the mesh and all its sub meshes, and owns their materials:
 * disposing it disposes the mesh (buffers once) and each distinct material once.
 * @public
 */
export class SceneMesh implements IDisposable {

    private _disposed = false;

    /**
     * The constructor.
     * @param mesh The root renderable mesh.
     */
    public constructor(public readonly mesh: IRenderableMesh) {
    }

    /** The mesh and all its sub meshes, depth first. */
    public get meshes(): IRenderableMesh[] {
        const result: IRenderableMesh[] = [];
        const visit = (m: IRenderableMesh) => {
            result.push(m);
            m.subMeshes.forEach(visit);
        };
        visit(this.mesh);
        return result;
    }

    /** The distinct materials of the mesh and its sub meshes. */
    public get materials(): IMaterial[] {
        const result: IMaterial[] = [];
        for (const m of this.meshes) {
            if (m.material && !result.includes(m.material)) {
                result.push(m.material);
            }
        }
        return result;
    }

    /** Draws the mesh and its sub meshes. */
    public render(): void {
        this.mesh.render();
    }

    /** Disposes the mesh and its materials. Calling it twice does nothing. */
    public dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        const materials = this.materials;
        this.mesh.dispose();
        for (const material of materials) {
            material.dispose();
        }
    }
}
