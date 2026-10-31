import {RenderableMesh} from "./RenderableMesh.ts";
import type { IRenderableMesh } from "./IRenderableMesh.ts";
import type { GeometryFormat } from "../geometry/GeometryFormat.ts";
import type { IMeshFactory } from "./IMeshFactory.ts";
import type { IGeometry } from "../geometry/IGeometry.ts";
import type { IMesh } from "./IMesh.ts";
import {QuadMesh} from "./QuadMesh.ts";
import type { IFramework } from "../IFramework.ts";
import {Mesh} from "./Mesh.ts";
import {vec2} from "gl-matrix";
import type { IMaterial } from "../material/IMaterial.ts";
import type { SubMeshDescriptor } from "./IMeshFactory.ts";

/**
 * The implementation of the mesh factory interface.
 */
export class MeshFactory implements IMeshFactory {

    /**
     * The constructor.
     * @param _framework The framework.
     */
    public constructor(private readonly _framework: IFramework) {
    }

    /** @inheritDoc */
    public createMesh(geometry: IGeometry, geometryFormat: GeometryFormat): IMesh {
        const mesh = new Mesh(this._framework);
        mesh.setGeometry(geometry, geometryFormat);
        return mesh;
    }

    /** @inheritDoc */
    public create(geometry: IGeometry, material: IMaterial): IRenderableMesh {
        const mesh = new RenderableMesh(this._framework, material);
        mesh.setGeometry(geometry);
        return mesh;
    }

    /** @inheritDoc */
    public createWithSubMeshes(geometry: IGeometry, subMeshes: SubMeshDescriptor[]): IRenderableMesh {
        if (subMeshes.length == 0) {
            throw new Error("createWithSubMeshes needs at least one submesh.");
        }
        const format = subMeshes[0].material.geometryFormat;
        if (subMeshes.some(s => s.material.geometryFormat != format)) {
            throw new Error("All submesh materials must use the same geometry format, as they share one vertex buffer.");
        }

        const mesh = new RenderableMesh(this._framework);
        mesh.setGeometry(geometry, format);
        for (const subMesh of subMeshes) {
            mesh.addSubMesh(subMesh.material, subMesh.indexStart, subMesh.indexCount);
        }
        return mesh;
    }

    /** @inheritDoc */
    public createQuadMesh(_isUpdatable: boolean, _scale?: vec2): QuadMesh {

        throw new Error("Meshes not implemented.");
        /*  const quadMesh = new QuadMesh(this._framework, isUpdatable, scale);
        quadMesh.initialize();
        return quadMesh;

       */
    }

}