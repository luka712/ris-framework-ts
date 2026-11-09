import type {ITempRenderer} from "../../api/rendering/renderer-interface.ts";
import type {vec2} from "gl-matrix";
import type {RenderingLimits} from "../../api/rendering/rendering-limits.ts";
import {
    Color,
    type ICanvasManager,
    type IFramework,
    type IGraphicsDevice,
    type IMainRenderTargetRenderPipeline,
    type IRendererConfiguration,
    type IRenderPass,
    type ISwapChain,
    type ISwapChainDescriptor,
    type ITexture2D,
    OutputColorSpace,
    RenderingBackend,
    RenderPassColorAttachment,
    RenderPassDepthStencilAttachment,
    RenderPassDescriptor,
    TextureFormat,
    TextureUsage
} from "../../api";

export abstract class ARenderer implements ITempRenderer {

    protected readonly _framework: IFramework;

    /**
     * The resize listeners.
     */
    protected _resizeListeners: ((sender: any, size: vec2) => void)[] = [];

    private readonly _canvasManager: ICanvasManager;
    private _graphicsDevice: IGraphicsDevice = null!;
    private _preferredDepthStencilFormat: TextureFormat = TextureFormat.DEPTH24_PLUS_STENCIL8;
    private readonly _currentBackBufferSize: vec2 = [0, 0];
    private _swapChainRequiresResize: boolean = false;
    private _mainRenderPassDirty = true;
    private _clearColor: Color = Color.lightPink();
    protected _outputColorSpace: OutputColorSpace;

    protected _mainRenderTargetRequiresResize: boolean = false;
    protected _swapChain: ISwapChain = null!;
    protected _mainRenderTarget: ITexture2D = null!;
    protected _depthStencilBuffer: ITexture2D = null!;
    protected _swapChainRenderPass: IRenderPass = null!;
    protected _mainRenderTargetRenderPass?: IRenderPass;
    protected _mainRenderTargetPipeline?: IMainRenderTargetRenderPipeline;
    protected _renderConfiguration: IRendererConfiguration;


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

    /** The rendering limits. Not implemented yet; always throws. */
    public get limits(): RenderingLimits | null {
        throw new Error("ARenderer.limits: Not implemented.");
    }

    /** @inheritdoc */
    public get preferredTextureFormat(): TextureFormat {
        return this._outputColorSpace == OutputColorSpace.SRGB ? TextureFormat.RGBA8_UNORM_SRGB : TextureFormat.RGBA8_UNORM;
    }

    /** @inheritDoc */
    public get outputColorSpace(): OutputColorSpace {
        return this._outputColorSpace;
    }

    /**
     * Switches the output color space without recreating the main render target.
     * The main render target stays {@link TextureFormat.RGBA8_UNORM} (linear); the blit pipeline encodes to sRGB in the
     * shader when this is {@link OutputColorSpace.SRGB} (see {@link IMainRenderTargetRenderPipeline.outputColorSpace}).
     * {@link preferredTextureFormat} still follows this value for content loading.
     * @inheritDoc
     */
    public set outputColorSpace(colorSpace: OutputColorSpace) {
        if (colorSpace == this._outputColorSpace) {
            return;
        }
        this._outputColorSpace = colorSpace;

        // Before afterInitialize there is nothing to switch yet; _setupMainRenderPass uses the new value.
        if (this._mainRenderTargetPipeline) {
            this._mainRenderTargetPipeline.outputColorSpace = colorSpace;
        }
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
     * @param configuration The renderer configuration.
     */
    protected constructor(framework: IFramework, configuration: IRendererConfiguration) {
        this._framework = framework;
        this._renderConfiguration = configuration;
        this._canvasManager = framework.canvasManager;
        this._currentBackBufferSize[0] = this._canvasManager.canvas.width;
        this._currentBackBufferSize[1] = this._canvasManager.canvas.height;
        this._outputColorSpace = configuration.outputColorSpace;
    }

    /** The rendering backend. Defaults to {@link RenderingBackend.WEB_GL}; backends override it. */
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

    /** Compute passes are not implemented yet; always throws. */
    beginComputePass(): void {
        throw new Error("ARenderer.beginComputePass: compute passes are not implemented.");
    }
    /** Compute passes are not implemented yet; always throws. */
    endComputePass(): void {
        throw new Error("ARenderer.endComputePass: compute passes are not implemented.");
    }

    /**
     * Creates the graphics device for the renderer.
     *  This is an abstract method that must be implemented by subclasses to provide the specific graphics device implementation for the renderer.
     * @returns The graphics device for the renderer.
     */
    protected abstract createGraphicsDevice(): IGraphicsDevice;

    /** @inheritdoc */
    public async initializeAsync(): Promise<void> {

        this._graphicsDevice = this.createGraphicsDevice();
        await this._graphicsDevice.initializeAsync();

        const swapchainDescriptor: ISwapChainDescriptor = {
            desiredOutputColorSpace: this._outputColorSpace,
        };

        this._swapChain = this._graphicsDevice.createSwapChain(
            this._canvasManager.canvas,
            swapchainDescriptor);
        // TODO: RESIZE EVENT

    }

    /** @inheritdoc */
    public afterInitialize(): void {

        let colorAttachment = new RenderPassColorAttachment();
        colorAttachment.swapChain = this._swapChain;
        colorAttachment.clearColor = Color.transparent();
        this._swapChainRenderPass = this._graphicsDevice.createRenderPass({
            colorAttachments: [colorAttachment],
        });

        this._setupMainRenderPass();
    }

    private _setupMainRenderPass(): void {

        this._mainRenderTargetPipeline?.dispose();
        this._depthStencilBuffer?.dispose();
        this._mainRenderTarget?.dispose();

        // Main frame buffer stays linear (RGBA8_UNORM). Encoding to sRGB (when outputColorSpace is SRGB) is done in
        // the blit shader on both backends, so the canvas / swap chain never needs an sRGB view for output.
        this._mainRenderTarget = this._framework.textureFactory.createEmpty(
            this.backBufferSize,
            undefined,
            TextureUsage.TEXTURE_BINDING | TextureUsage.RENDER_ATTACHMENT,
            TextureFormat.RGBA8_UNORM,
            "Renderer_MainRenderTarget",
            false,
        );

        this._depthStencilBuffer = this._framework.textureFactory.createEmpty(
            this.backBufferSize,
            undefined,
            TextureUsage.RENDER_ATTACHMENT,
            this.preferredDepthStencilFormat);

        // Create main frame buffer pipeline.
        this._mainRenderTargetPipeline = this._framework
            .renderPipelineFactory
            .createMainFrameBufferPipeline(this._mainRenderTarget);
        this._mainRenderTargetPipeline.outputColorSpace = this._outputColorSpace;

        this._createMainRenderPass();
        this._mainRenderTargetRequiresResize = false;
    }

    /**
     * The main render pass color attachment for the linear main render target.
     * When {@link IGraphicsDeviceFeatures.supportsTextureView} is true (WebGPU), the default linear view is set;
     * on WebGL2 textures are attached directly (views are not supported).
     */
    private _createMainColorAttachment(): RenderPassColorAttachment {
        const colorAttachment = new RenderPassColorAttachment();
        colorAttachment.texture = this._mainRenderTarget;
        if (this._graphicsDevice.features.supportsTextureView) {
            colorAttachment.view = this._mainRenderTarget.defaultTextureView;
        }
        colorAttachment.clearColor = this._clearColor;
        return colorAttachment;
    }

    private _createMainRenderPass(): void {
        this._mainRenderTargetRenderPass?.dispose();
        const renderPassDesc = new RenderPassDescriptor();
        renderPassDesc.colorAttachments = [this._createMainColorAttachment()];
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