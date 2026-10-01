import type { ITempRenderer } from "../renderer/renderer-interface.ts";
import type { IRenderPass } from "./render-pass/render-pass-interface.ts";
import type { vec2 } from "gl-matrix";
import type { RenderingLimits } from "../renderer/rendering-limits.ts";
import {
    type IFramework, type IGraphicsDevice, type IMainRenderTargetRenderPipeline, type ISwapChain,
    type ITexture2D, type IWindowManager,
    RenderingBackend,
    RenderPassColorAttachment, RenderPassDepthStencilAttachment,
    RenderPassDescriptor, SwapChainDescriptor,
    TextureUsage
} from "ris-framework-api";
import {TextureFormat, Color} from "ris-framework-api";

export abstract class ARenderer implements ITempRenderer {

    protected readonly _framework: IFramework;

    /**
     * The resize listeners.
     */
    protected _resizeListeners: ((sender: any, size: vec2) => void)[] = [];

    private readonly _windowManager: IWindowManager;
    private _graphicsDevice: IGraphicsDevice = null!;
    private _preferredTextureFormat: TextureFormat = TextureFormat.RGBA_8_UNORM;
    private _preferredDepthStencilFormat: TextureFormat = TextureFormat.DEPTH_24_STENCIL_8;
    private readonly _currentBackBufferSize: vec2 = [0, 0];
    private _swapChainRequiresResize: boolean = false;
    private _mainRenderPassDirty = true;
    private _clearColor: Color = Color.lightPink();

    protected _mainRenderTargetRequiresResize: boolean = false;
    protected _swapChain: ISwapChain = null!;
    protected _mainRenderTarget: ITexture2D = null!;
    protected _depthStencilBuffer: ITexture2D = null!;
    protected _swapChainRenderPass: IRenderPass = null!;
    protected _mainRenderTargetRenderPass?: IRenderPass;
    protected _mainRenderTargetPipeline?: IMainRenderTargetRenderPipeline;

    /** @inheritdoc */
    public get graphicsDevice(): IGraphicsDevice {
        return this._graphicsDevice;
    }

    /** @inheritdoc */
    public get clearColor(): Color {
        return this._clearColor;
    }

    /** @inheritdoc */
    public set clearColor(color: Color) {
        this._clearColor = color;
        this._mainRenderPassDirty = true;
    }

    public get limits(): RenderingLimits | null {
        throw new Error("Method not implemented.");
    }

    /** @inheritdoc */
    public get preferredTextureFormat(): TextureFormat {
        return this._preferredTextureFormat;
    }

    /** @inheritdoc */
    public get preferredDepthStencilFormat(): TextureFormat {
        return this._preferredDepthStencilFormat;
    }

    /** @inheritdoc */
    public get backBufferSize(): vec2 {
        return this._currentBackBufferSize;
    }

    /** @inheritdoc */
    public set backBufferSize(size: vec2) {
        if (this.backBufferMatchesSwapChain) {
            console.warn(`Attempting to set back buffer size to ${size[0]}x${size[1]}, but back buffer is currently matching the swap chain.
                 To set the back buffer size, either set backBufferMatchesSwapChain to false, or resize the swap chain using the setSize method on the swap chain.`);
        } else {
            this._currentBackBufferSize[0] = size[0];
            this._currentBackBufferSize[1] = size[1];
            this._mainRenderTargetRequiresResize = true;

            // TODO: should we resize swapchain as well?
            this._swapChainRequiresResize = true;
        }
    }

    /** @inheritdoc */
    public backBufferMatchesSwapChain: boolean = false;

    /**
     * The constructor.
     * @param framework The framework.
     */
    constructor(framework: IFramework) {
        this._framework = framework;
        this._windowManager = framework.windowManager;
        this._currentBackBufferSize[0] = this._windowManager.canvas.width;
        this._currentBackBufferSize[1] = this._windowManager.canvas.height;
    }

     backend: RenderingBackend = RenderingBackend.WEB_GL;

    /** @inheritDoc */
    public addOnResizedListener(event: (sender: any, e: vec2) => void): void {
        this._resizeListeners.push(event);
    }

    /** @inheritDoc */
    public removeOnResizedListener(event: (sender: any, e: vec2) => void): void {
        const index = this._resizeListeners.indexOf(event);
        if (index >= 0) {
            this._resizeListeners.splice(index, 1);
        }
    }
    beginComputePass(): void {
        throw new Error("Method not implemented.");
    }
    endComputePass(): void {
        throw new Error("Method not implemented.");
    }

    /**
     * Creates the graphics device for the renderer.
     *  This is an abstract method that must be implemented by subclasses to provide the specific graphics device implementation for the renderer.
     * @returns The graphics device for the renderer.
     */
    protected abstract createGraphicsDevice(): IGraphicsDevice;

    /** @inheritdoc */
    public initialize(): void {
        this._graphicsDevice = this.createGraphicsDevice();
        this._graphicsDevice.initialize();
        this._swapChain = this._graphicsDevice.createSwapChain(
            this._windowManager.canvas,
            new SwapChainDescriptor());
        this._preferredTextureFormat = this._swapChain.textureFormat

        // TODO: RESIZE EVENT

    }

    /** @inheritdoc */
    public afterInitialize(): void {

        let colorAttachment = new RenderPassColorAttachment();
        colorAttachment.swapChain = this._swapChain;
        this._swapChainRenderPass = this._graphicsDevice.createRenderPass({
            colorAttachments: [colorAttachment],
        });

        this._setupMainRenderPass();
    }

    private _setupMainRenderPass(): void {

        this._mainRenderTargetPipeline?.dispose();
        this._depthStencilBuffer?.dispose();
        this._mainRenderTarget?.dispose();

        // Create a main frame buffer.
        this._mainRenderTarget = this._framework.textureFactory.createEmpty(
            this.backBufferSize[0], this.backBufferSize[1],
            undefined,
            TextureUsage.TEXTURE_BINDING | TextureUsage.RENDER_ATTACHMENT,
            this.preferredTextureFormat
        );

        this._depthStencilBuffer = this._framework.textureFactory.createEmpty(
            this.backBufferSize[0], this.backBufferSize[1],
            undefined,
            TextureUsage.RENDER_ATTACHMENT,
            this.preferredDepthStencilFormat);

        // Create main frame buffer pipeline.
        this._mainRenderTargetPipeline = this._framework
            .renderPipelineFactory
            .createMainFrameBufferPipeline(this._mainRenderTarget);

        this._createMainRenderPass();
        this._mainRenderTargetRequiresResize = false;
    }

    private _createMainRenderPass(): void {
        this._mainRenderTargetRenderPass?.dispose();
        const renderPassDesc = new RenderPassDescriptor();
        const colorAttachment = new RenderPassColorAttachment();
        colorAttachment.texture = this._mainRenderTarget;
        colorAttachment.clearColor = this._clearColor;
        renderPassDesc.colorAttachments = [colorAttachment];
        renderPassDesc.depthStencilAttachment = new RenderPassDepthStencilAttachment();
        renderPassDesc.depthStencilAttachment.texture = this._depthStencilBuffer;
        this._mainRenderTargetRenderPass = this._graphicsDevice.createRenderPass(renderPassDesc);
        this._mainRenderPassDirty = false;
    }

    private _handleResizing(): void {
        // If back buffer size is set to match swap chain size, then main render target needs
        // to be resized whenever swap chain needs to be resized.
        // If back buffer size is not set to match swap chain size,
        // then main render target only needs to be resized when back buffer size is changed.
        if ((this.backBufferMatchesSwapChain && this._swapChainRequiresResize) || this._mainRenderTargetRequiresResize) {
            this._setupMainRenderPass();

            for(const listener of this._resizeListeners){
                listener(this, this.backBufferSize);
            }
        }

        if (!this._swapChainRequiresResize) {
            return;
        }

        // Note: surface texture and surface texture view must be released before trying to resize.
        this._swapChain.resize(this.backBufferSize[0], this.backBufferSize[1]);

        // ConfigureDepthStencil();
        this._swapChainRequiresResize = false;
    }

    /** @inheritdoc */
    public beginRenderPass(): void {
        this._mainRenderTargetRenderPass!.beginPass();
    }

    /** @inheritdoc */
    public endRenderPass(): void {
        this._mainRenderTargetRenderPass!.endPass();

        this._handleResizing();

        this._swapChainRenderPass!.beginPass();
        this._mainRenderTargetPipeline!.render();
        this._swapChainRenderPass!.endPass();

        this._swapChain.present();

        // For example, clear color change.
        if(this._mainRenderPassDirty) {
            this._createMainRenderPass();
        }
    }

}