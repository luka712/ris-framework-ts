import {IMeshFactory} from "./IMeshFactory";
import {IGeometry} from "../geometry/IGeometry";
import {GeometryFormat} from "../geometry/GeometryFormat";
import {IMesh} from "./IMesh";
import {QuadMesh} from "./QuadMesh";
import {IFramework} from "../IFramework";
import {Mesh} from "./Mesh";
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