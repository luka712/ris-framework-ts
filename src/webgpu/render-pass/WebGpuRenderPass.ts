import {
    type IRenderPass,
    LoadAction,
    type RenderPassDescriptor,
    StoreAction,
} from "../../api/index.ts";
import type {WebGpuGraphicsDevice} from "../WebGpuGraphicsDevice.ts";
import type {
    GpuCommandEncoder,
    GpuRenderPassColorAttachment,
    GpuRenderPassDepthStencilAttachment,
    GpuRenderPassDescriptor,
} from "../WebGpuTypes.ts";
import {WebGpuConverter} from "../utilities/WebGpuConverter.ts";
import {WebGpuTexture2D} from "../texture/WebGpuTexture2D.ts";
import {WebGpuTextureView} from "../texture/WebGpuTextureView.ts";
import type {WebGpuSwapChain} from "../swap-chain/WebGpuSwapChain.ts";

/**
 * The WebGPU render pass. `beginPass` creates a command encoder and begins a render pass,
 * `endPass` ends it and submits the command buffer, like the C# `WebGPURenderPass`.
 * @internal
 */
export class WebGpuRenderPass implements IRenderPass {

    private readonly _graphicsDevice: WebGpuGraphicsDevice;
    private readonly _descriptor: RenderPassDescriptor;
    private _commandEncoder: GpuCommandEncoder | null = null;

    /**
     * The constructor.
     * @param graphicsDevice The graphics device.
     * @param descriptor The render pass descriptor.
     */
    public constructor(graphicsDevice: WebGpuGraphicsDevice, descriptor: RenderPassDescriptor) {
        this._graphicsDevice = graphicsDevice;
        this._descriptor = descriptor;
        if (!descriptor.colorAttachments || descriptor.colorAttachments.length === 0) {
            throw new Error("WebGpuRenderPass: at least one color attachment is required.");
        }
    }

    private _buildDescriptor(): GpuRenderPassDescriptor {
        const colorAttachments: GpuRenderPassColorAttachment[] = this._descriptor.colorAttachments!.map(attachment => {
            let view;
            if (attachment.swapChain) {
                view = (attachment.swapChain as WebGpuSwapChain).currentTextureView;
            } else if (attachment.view) {
                view = (attachment.view as WebGpuTextureView).gpuTextureView;
            } else if (attachment.texture) {
                view = (attachment.texture as WebGpuTexture2D).gpuDefaultView;
            } else {
                throw new Error("WebGpuRenderPass: a color attachment needs a swap chain, view or texture.");
            }
            const c = attachment.clearColor;
            return {
                view,
                resolveTarget: attachment.resolveView
                    ? (attachment.resolveView as WebGpuTextureView).gpuTextureView
                    : attachment.resolveTexture ? (attachment.resolveTexture as WebGpuTexture2D).gpuDefaultView : undefined,
                clearValue: {r: c.r, g: c.g, b: c.b, a: c.a},
                loadOp: WebGpuConverter.convertLoadAction(attachment.loadAction),
                storeOp: WebGpuConverter.convertStoreAction(attachment.storeAction),
            };
        });

        const result: GpuRenderPassDescriptor = {
            label: this._descriptor.label,
            colorAttachments,
        };

        const depth = this._descriptor.depthStencilAttachment;
        if (depth && (depth.texture || depth.view)) {
            const texture = depth.texture as WebGpuTexture2D | undefined;
            const format = depth.view?.textureFormat ?? texture!.textureFormat;
            const attachment: GpuRenderPassDepthStencilAttachment = {
                view: depth.view ? (depth.view as WebGpuTextureView).gpuTextureView : texture!.gpuDefaultView,
                depthClearValue: depth.depthClearValue,
                depthLoadOp: WebGpuConverter.convertLoadAction(depth.depthLoadAction),
                depthStoreOp: WebGpuConverter.convertStoreAction(depth.depthStoreAction),
            };
            // Stencil ops are only valid when the format has a stencil aspect.
            if (WebGpuConverter.hasStencil(format)) {
                attachment.stencilClearValue = depth.stencilClearValue;
                attachment.stencilLoadOp = depth.stencilLoadAction === LoadAction.LOAD ? "load" : "clear";
                attachment.stencilStoreOp = depth.stencilStoreAction === StoreAction.DISCARD ? "discard" : "store";
            }
            result.depthStencilAttachment = attachment;
        }
        // A depth attachment without a texture would need an internal depth buffer (WebGL uses a renderbuffer).
        // TODO: create an internal depth texture for that case.

        return result;
    }

    /** Whether the pass has a depth attachment. */
    public get hasDepthStencil(): boolean {
        const depth = this._descriptor.depthStencilAttachment;
        return !!depth && !!(depth.texture || depth.view);
    }

    /** @inheritDoc */
    public beginPass(): void {
        if (this._commandEncoder) {
            throw new Error("WebGpuRenderPass: the pass is already open.");
        }
        const device = this._graphicsDevice.device;
        this._commandEncoder = device.createCommandEncoder({label: this._descriptor.label});
        this._graphicsDevice.currentRenderPassEncoder = this._commandEncoder.beginRenderPass(this._buildDescriptor());
    }

    /** @inheritDoc */
    public endPass(): void {
        if (!this._commandEncoder) {
            return;
        }
        this._graphicsDevice.currentRenderPassEncoder?.end();
        this._graphicsDevice.currentRenderPassEncoder = null;
        this._graphicsDevice.device.queue.submit([this._commandEncoder.finish()]);
        this._commandEncoder = null;
    }

    /** @inheritDoc */
    public dispose(): void {
        if (this._commandEncoder) {
            this._graphicsDevice.currentRenderPassEncoder?.end();
            this._graphicsDevice.currentRenderPassEncoder = null;
            this._commandEncoder = null;
        }
    }
}
