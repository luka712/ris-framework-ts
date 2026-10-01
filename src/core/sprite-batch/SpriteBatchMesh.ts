import type {vec2, vec3} from "gl-matrix";
import {BufferUsage, type Color, type IFramework, Mesh} from "ris-framework-api";

/**
 * The sprite batch mesh.
 */
export class SpriteBatchMesh extends Mesh {

    /**
     * The number of floats components per vertex.
     * 9 since it's build as (xyz rgba uv).
     */
    static readonly TOTAL_FLOATS_PER_VERTEX = 9;

    /** The total number of floats in a sprite. 4 for each vertex * 9 floats per vertex (xyz rgba uv). */
    static readonly TOTAL_FLOATS_IN_SPRITE = 4 * this.TOTAL_FLOATS_PER_VERTEX;

    private _maxInstances = 0;
    private _lastIndex = -1;

    /**
     * The constructor for the batch sprite mesh.
     */
    public constructor(framework: IFramework, numberOfInstances: number) {
        super(framework);
        this._maxInstances = numberOfInstances;

        this._vertexData = new Array(this.maxInstances * SpriteBatchMesh.TOTAL_FLOATS_IN_SPRITE);

        this._setupIndices();
    }

    private _setupIndices(): void {
        const indices = [];

        for (let i = 0; i < this.maxInstances; i++) {
            // Indices
            const indicesStartIndex = i * 4;

            indices.push(indicesStartIndex + 2); // Bottom left.
            indices.push(indicesStartIndex + 3); // Bottom right.
            indices.push(indicesStartIndex + 1); // Top right.
            indices.push(indicesStartIndex + 1); // Top right.
            indices.push(indicesStartIndex + 0); // Top left.
            indices.push(indicesStartIndex + 2); // Bottom left.
        }

        this._indices = indices;
    }

    /** The maximum number of instances that can be batched. */
    public get maxInstances() {
        return this._maxInstances;
    }

    /** @inheritDoc */
    public override initialize(): void {
        this._vertexBuffer = this._framework.bufferFactory.createVertexBuffer(
            this._vertexData!,
            this.maxInstances * 4,
            BufferUsage.VERTEX | BufferUsage.COPY_DST,
            "SpriteBatchMesh.VertexBuffer");

        this._indexBuffer = this._framework.bufferFactory.createIndexBuffer(
            this._indices!,
            "SpriteBatchMesh.IndexBuffer");

    }

    /** Resize the batch sprite mesh so that more instances can be drawn. */
    public resize(newSize: number): void {
        if (newSize == this.maxInstances) {
            return;
        }

        this._maxInstances = newSize;

        // Create new data.
        const newData = new Array(this._maxInstances * SpriteBatchMesh.TOTAL_FLOATS_IN_SPRITE); // 36 due to 9(xyz rgba uv) * 4 vertices.

        // Copy to new data.
        newData.push(this._vertexData)

        // Replace old data.
        this._vertexData = newData;

        this._setupIndices();

        // Dispose of buffers.
        this._vertexBuffer?.dispose();
        this._indexBuffer?.dispose();

        // Assign new buffers.
        this.initialize();
    }

    /** @inheritDoc */
    public writeSprite(
        instance: number,
        position: vec3, size: vec2, color: Color,
        u0 = 0, v0 = 0, u1 = 1, v1 = 1, flipY = false) {
        if (flipY) {
            v0 = 1;
            v1 = 0;
        }

        let index = instance * SpriteBatchMesh.TOTAL_FLOATS_IN_SPRITE; // 36 due to 9 * 4 vertices.

        // Top left.
        this._vertexData![index++] = position[0]
        this._vertexData![index++] = position[1];
        this._vertexData![index++] = position[2];
        this._vertexData![index++] = color.r;
        this._vertexData![index++] = color.g;
        this._vertexData![index++] = color.b;
        this._vertexData![index++] = color.a;
        this._vertexData![index++] = u0;
        this._vertexData![index++] = v0;

        // Top right.
        this._vertexData![index++] = position[0] + size[0];
        this._vertexData![index++] = position[1];
        this._vertexData![index++] = position[2];
        this._vertexData![index++] = color.r;
        this._vertexData![index++] = color.g;
        this._vertexData![index++] = color.b;
        this._vertexData![index++] = color.a;
        this._vertexData![index++] = u1;
        this._vertexData![index++] = v0;

        // Bottom left.
        this._vertexData![index++] = position[0];
        this._vertexData![index++] = position[1] + size[1];
        this._vertexData![index++] = position[2];
        this._vertexData![index++] = color.r;
        this._vertexData![index++] = color.g;
        this._vertexData![index++] = color.b;
        this._vertexData![index++] = color.a;
        this._vertexData![index++] = u0;
        this._vertexData![index++] = v1;

        // Bottom right.
        this._vertexData![index++] = position[0] + size[0];
        this._vertexData![index++] = position[1] + size[1];
        this._vertexData![index++] = position[2];
        this._vertexData![index++] = color.r;
        this._vertexData![index++] = color.g;
        this._vertexData![index++] = color.b;
        this._vertexData![index++] = color.a;
        this._vertexData![index++] = u1;
        this._vertexData![index] = v1;

        this._lastIndex = index;
    }

    /*
    public void WriteSprite(int instance,
    Vector3D<float> position,
    Vector2D<float> size,
        Color color,
        float rotation, Vector2D<float> rotationOrigin,
        float u0 = 0, float v0 = 0, float u1 = 1, float v1 = 1)
    {
        int index = instance * TOTAL_FLOATS_IN_SPRITE; // 36 due to 9 * 4 vertices.

        Vector2D<float> topLeft = new(position.X, position.Y);
        Vector2D<float> topRight = new(position.X + size.X, position.Y);
        Vector2D<float> bottomLeft = new(position.X, position.Y + size.Y);
        Vector2D<float> bottomRight = new(position.X + size.X, position.Y + size.Y);

        if (rotation != 0)
        {
            Vector2D<float> rotationOriginOffset = new (
                topLeft.X + rotationOrigin.X * size.X,
                topLeft.Y + rotationOrigin.Y * size.Y);

            topLeft.RotateSelfAroundPointCCW(rotationOriginOffset, rotation);
            topRight.RotateSelfAroundPointCCW(rotationOriginOffset, rotation);
            bottomLeft.RotateSelfAroundPointCCW(rotationOriginOffset, rotation);
            bottomRight.RotateSelfAroundPointCCW(rotationOriginOffset, rotation);
        }

        // Top left.
        _vertexData[index++] = topLeft.X;
        _vertexData[index++] = topLeft.Y;
        _vertexData[index++] = position.Z;
        _vertexData[index++] = color.R;
        _vertexData[index++] = color.G;
        _vertexData[index++] = color.B;
        _vertexData[index++] = color.A;
        _vertexData[index++] = u0;
        _vertexData[index++] = v0;

        // Top right.
        _vertexData[index++] = topRight.X;
        _vertexData[index++] = topRight.Y;
        _vertexData[index++] = position.Z;
        _vertexData[index++] = color.R;
        _vertexData[index++] = color.G;
        _vertexData[index++] = color.B;
        _vertexData[index++] = color.A;
        _vertexData[index++] = u1;
        _vertexData[index++] = v0;

        // Bottom left.
        _vertexData[index++] = bottomLeft.X;
        _vertexData[index++] = bottomLeft.Y;
        _vertexData[index++] = position.Z;
        _vertexData[index++] = color.R;
        _vertexData[index++] = color.G;
        _vertexData[index++] = color.B;
        _vertexData[index++] = color.A;
        _vertexData[index++] = u0;
        _vertexData[index++] = v1;

        // Bottom right.
        _vertexData[index++] = bottomRight.X;
        _vertexData[index++] = bottomRight.Y;
        _vertexData[index++] = position.Z;
        _vertexData[index++] = color.R;
        _vertexData[index++] = color.G;
        _vertexData[index++] = color.B;
        _vertexData[index++] = color.A;
        _vertexData[index++] = u1;
        _vertexData[index] = v1;
    }
     */

    /** @inheritDoc */
    public override applyChanges(): void {

        if(this._lastIndex <= 0)
        {
            return;
        }

        // TODO: update is way to large. U

        // Update only to last index.
        // Increment index by 1, since it's index, not a count.
        this._vertexBuffer!.update(this._vertexData!, 0, this._lastIndex + 1);
    }
}