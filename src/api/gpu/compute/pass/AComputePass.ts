import type { IGraphicsDevice } from "../../IGraphicsDevice";
import type { IComputePass } from "./IComputePass";
import type { IComputePassDescriptor } from "./IComputePassDescriptor";

export abstract class AComputePass implements IComputePass {


    constructor(
        protected readonly _graphicsDevice: IGraphicsDevice,
        protected readonly _descriptor: IComputePassDescriptor) {

        this.label = _descriptor.label;
    }

    /** @inheritdoc */
    public label?: string | undefined;


    /** @inheritdoc */
    public beginPass(): void {
        this._graphicsDevice.currentComputePass = this;
        this._beginPass();
    }

    /**The implementation of beginPass;  */
    protected abstract _beginPass(): void;

    /** @inheritdoc */
    public abstract endPass(): void;

    /** @inheritdoc */
    public abstract dispose(): void;
}