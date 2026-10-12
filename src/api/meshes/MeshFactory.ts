import type { IMeshFactory } from "./IMeshFactory.ts";
import type { IGeometry } from "../geometry/IGeometry.ts";
import type { IMesh } from "./IMesh.ts";
import {QuadMesh} from "./QuadMesh.ts";
import type { IFramework } from "../IFramework.ts";
import {Mesh} from "./Mesh.ts";
import {vec2} from "gl-matrix";
import type { IMaterial } from "../material/IMaterial.ts";

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
    public create(geometry: IGeometry, material: IMaterial): IMesh {
        const mesh = new Mesh(this._framework, material);
        mesh.setGeometry(geometry);
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