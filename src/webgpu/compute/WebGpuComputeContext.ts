import type { IFramework } from "../../api/IFramework.ts";
import type { IComputeContext } from "../../api/gpu/compute/IComputeContext.ts";
import type { IComputePass } from "../../api/gpu/compute/pass/IComputePass.ts";
import type { IComputePassDescriptor } from "../../api/gpu/compute/pass/IComputePassDescriptor.ts";
import type { IDisposable } from "../../api/core/IDisposable.ts";
import type { IGraphicsDevice } from "../../api/gpu/IGraphicsDevice.ts";
import type { WebGpuGraphicsDevice } from "../WebGpuGraphicsDevice.ts";
import { WebGpuComputePass } from "./WebGpuComputePass.ts";

/**
 * The WebGPU compute context.
 * @internal
 */
export class WebGpuComputeContext implements IComputeContext {

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private _mainComputePass: WebGpuComputePass = null!;
    private readonly _disposeQueue: IDisposable[] = [];
    private _disposed = false;

    /**
     * The constructor.
     * @param framework The framework.
     */
    public constructor(framework: IFramework) {
        this._graphicsDevice = framework.graphicsDevice as WebGpuGraphicsDevice;
    }

    /** @inheritdoc */
    public initialize(): void {
        this._mainComputePass = new WebGpuComputePass(this._graphicsDevice, {});
    }

    /** @inheritDoc */
    public get graphicsDevice(): IGraphicsDevice {
        return this._graphicsDevice;
    }

    /** @inheritDoc */
    public get mainComputePass(): IComputePass {
        return this._mainComputePass;
    }

    /** @inheritdoc */
    public createComputePass(descriptor?: IComputePassDescriptor): IComputePass {
        const desc = descriptor ? { ...descriptor } : {};
        const pass = new WebGpuComputePass(this._graphicsDevice, desc);
        return pass;
    }

    /**
     * Queues a resource to dispose after the main command encoder is submitted.
     * @internal
     */
    public queueDispose(disposable: IDisposable): void {
        this._disposeQueue.push(disposable);
    }


    /** @inheritDoc */
    public beginComputePass(): void {
        if (this._disposed) {
            throw new Error("WebGpuComputeContext.beginComputePass: the context is disposed.");
        }
        this._mainComputePass.beginPass();
    }

    /** @inheritDoc */
    public endComputePass(): void {
        if (this._disposed) {
            throw new Error("WebGpuComputeContext.endComputePass: the context is disposed.");
        }
        this._mainComputePass.endPass();
    }

    /** @inheritDoc */
    public frameEnd(): void {
        for (const item of this._disposeQueue) {
            item.dispose();
        }
        this._disposeQueue.length = 0;
    }

    /** @inheritDoc */
    public pushDebugGroup(label: string): void {
        this._mainComputePass.gpuComputePassEncoder?.pushDebugGroup(label);
    }

    /** @inheritDoc */
    public popDebugGroup(): void {
        this._mainComputePass.gpuComputePassEncoder?.popDebugGroup();
    }

    /**
     * Disposes the context and its main compute pass. An open pass is ended without submitting. Calling it twice does nothing.
     */
    public dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._disposeQueue.length = 0;
        this._mainComputePass.dispose();
    }
}
