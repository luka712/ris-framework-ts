import type { IMeshFactory } from "./IMeshFactory.ts";
import type { IGeometry } from "../geometry/IGeometry.ts";
import {GeometryFormat} from "../geometry/GeometryFormat.ts";
import type { IMesh } from "./IMesh.ts";
import {QuadMesh} from "./QuadMesh.ts";
import type { IFramework } from "../IFramework.ts";
import {Mesh} from "./Mesh.ts";
import {vec2} from "gl-matrix";

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
    public create(geometry: IGeometry, geometryFormat: GeometryFormat): IMesh {
        const mesh = new Mesh(this._framework);
        mesh.setGeometry(geometry, geometryFormat);
        return mesh;
    }

    /** @inheritDoc */
    public createQuadMesh(isUpdatable: boolean, scale?: vec2): QuadMesh {
        const quadMesh = new QuadMesh(this._framework, isUpdatable, scale);
        quadMesh.initialize();
        return quadMesh;
    }

}