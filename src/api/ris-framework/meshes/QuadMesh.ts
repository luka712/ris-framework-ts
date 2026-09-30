import {Mesh} from "./Mesh";
import {Rect} from "../data/Rect";
import {IFramework} from "../IFramework";
import {vec2} from "gl-matrix";
import {BufferUsage} from "../rendering/buffers/BufferUsage";

/**
 * The mesh of a quad.
 */
export class QuadMesh extends Mesh {

    private readonly ELEMENTS_IN_VERTEX = 9;
    private readonly TEX_COORD_POS_S = 7;
    private readonly TEX_COORD_POS_T = 8;

    /**
     * The constructor.
     * @param framework The framework.
     * @param _isUpdatable Makes mesh updatable.
     * @param scale The scale factor for geometry. If not set, it is set to (1,1).
     */
    public constructor(framework: IFramework, private _isUpdatable: boolean, scale?: vec2) {
    super(framework);
        if(_isUpdatable) {
            this._bufferUsage = BufferUsage.VERTEX | BufferUsage.COPY_DST;
        }

        scale = scale || vec2.fromValues(1,1);

        this._positions = [
            // V0 - bottom left
            -0.5 * scale[0], -0.5 * scale[1], 0.0,
            // V1 - top left
            -0.5 * scale[0], 0.5 * scale[1], 0.0,
            // V2 - bottom right
            0.5 * scale[0], -0.5 * scale[1], 0.0,
            // V3 - top right
            0.5 * scale[0], 0.5 * scale[1], 0.0
        ];

        this._colors = [
            1,1,1,1,
            1,1,1,1,
            1,1,1,1,
            1,1,1,1
        ];

        this._textureCoords = [

            // V0 - bottom left
            0, 1,
            // V1 - top left
            0, 0,
            // V2 - bottom right
            1, 1,
            // V3 - top right
            1, 0
        ];

        this._indices = [
            0, 2, 3, // t1
            3, 1, 0  // t2
        ]
    }

    /** @inheritDoc*/
    public initialize(): void {
        // This will initialize buffers with data.
        super.applyChanges();
    }

    /** @inheritDoc*/
    public applyChanges(): void {
        if (!this._isUpdatable)
        {
            throw new Error("This mesh is not updatable.");
        }

        this._vertexBuffer!.update(this._vertexData!);
    }

    /**
     * Update the texture coordinates of quad mesh.
     * ApplyChanges should be called after updating this mesh.
     * @param coordBounds - The texture coordinates rectangle.
     * Rectangle x and y define the top left position of texture coordinates.
     * Rectangle x + width and y + height define the bottom right position of texture coordinates.
     */
    public updateTextureCoords(coordBounds: Rect): void {

        // Order is bottom left, top left, bottom right, top right
        this._vertexData![this.TEX_COORD_POS_S] = coordBounds.x;
        this._vertexData![this.TEX_COORD_POS_T] = coordBounds.y + coordBounds.height;

        this._vertexData![this.TEX_COORD_POS_S + this.ELEMENTS_IN_VERTEX] = coordBounds.x;
        this._vertexData![this.TEX_COORD_POS_T + this.ELEMENTS_IN_VERTEX] = coordBounds.y;

        this._vertexData![this.TEX_COORD_POS_S + this.ELEMENTS_IN_VERTEX * 2] = coordBounds.x + coordBounds.width;
        this._vertexData![this.TEX_COORD_POS_T + this.ELEMENTS_IN_VERTEX * 2] = coordBounds.y + coordBounds.height;

        this._vertexData![this.TEX_COORD_POS_S + this.ELEMENTS_IN_VERTEX * 3] = coordBounds.x + coordBounds.width;
        this._vertexData![this.TEX_COORD_POS_T + this.ELEMENTS_IN_VERTEX * 3] = coordBounds.y;
    }
}
