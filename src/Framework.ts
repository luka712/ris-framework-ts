import {container, type DependencyContainer} from "tsyringe";
import {WindowManager} from "./api/window/WindowManager.ts";
import {FrameworkConfiguration} from "./api/FrameworkConfiguration.ts";
import {type IRendererConfiguration, RenderConfigurationSymbol} from "./api/rendering/renderer-interface.ts";
import {GeometryBuilder} from "./api/geometry/GeometryBuilder.ts";
import {ContentManager} from "./api/content/ContentManager.ts";
import {WebGlRenderer} from "./webgl/WebGlRenderer.ts";
import {WebGlBuffersFactory} from "./webgl/buffers/WebGlBuffersFactory.ts";
import {
    type ICameraFactory,
    type IContentManager,
    type IFramework, IFrameworkConfiguration,
    type IImageLoader,
    type IRenderer,
    type IRenderPipelineFactory,
    type IWindowManager
} from "./api/index.ts";
import {
    CameraFactory,
    CpuImageProcessor,
    GameTime,
    type IBufferFactory,
    type IGeometryBuilder,
    type IGraphicsDevice,
    type IImageProcessor,
    type IInputManager,
    ImageLoader,
    type IMaterialFactory,
    type IMeshFactory,
    type ISpriteBatch,
    type ITextureFactory,
    type ITimeManager,
    MaterialFactory,
    MeshFactory,
    RenderingBackend,
    TimeManager
} from "./api/index.ts";
import {WebGlShaderModuleLoader} from "./webgl/shader/WebGlShaderModuleLoader.ts";
import {TextureSamplerFilteringPreset} from "./core/rendering/enums.ts";
import {SpriteBatch} from "./api/sprites/SpriteBatch.ts";
import {WebGlTextureFactory} from "./webgl/texture/WebGlTextureFactory.ts";
import {WebGlRenderPipelineFactory} from "./webgl/render-pipelines/WebGlRenderPipelineFactory.ts";
import {InputManager} from "./api/input/InputManager.ts";
import type {IKtx2Factory} from "ris-ktx2";
import {Ktx2Factory} from "ris-ktx2";
import {PowerPreferenceType} from "./api/rendering/PowerPreference.ts";
import {vec2} from "gl-matrix";

export class Framework implements IFramework {

    private readonly _onLoadContentListeners: (() => void)[] = [];
    private readonly _onInitializeListeners: (() => void)[] = [];
    private readonly _onUpdateListeners: ((gameTime: GameTime) => void)[] = [];
    private readonly _onRenderListeners: (() => void)[] = [];

    private readonly _container: DependencyContainer;
    private readonly _textureFactory: ITextureFactory;
    private readonly _buffersFactory: IBufferFactory;
    private readonly _contentManager: IContentManager;
    private readonly _geometryBuilder: IGeometryBuilder;
    private readonly _meshFactory: IMeshFactory;

    /**
     * The constructor for the Framework class.
     * @param options The optional framework configuration. When omitted, a default `FrameworkConfiguration` is used.
     */
    constructor(options?: IFrameworkConfiguration) {
        options = options ?? new FrameworkConfiguration();

        // Without a canvas, WindowManager creates one and appends it to document.body.
        if(!options.canvas){
            console.warn("Canvas not provided. Creating canvas and appending it to document.body.")
        }
        options.backBufferSize = options.backBufferSize ?? vec2.fromValues(800, 600);

        this._container = container.createChildContainer();
        this.windowManager = new WindowManager(options.canvas ?? null);

        // Setup container.
        const rendererConfig: IRendererConfiguration = {
            backBufferSize: options.backBufferSize,
            textureFiltering: options.textureFiltering ?? TextureSamplerFilteringPreset.BILINEAR,
            alpha: options.alpha ?? false,
            powerPreference: options.powerPreference ?? PowerPreferenceType.DEFAULT
        };
        this._container.registerInstance(RenderConfigurationSymbol, rendererConfig);
        this.renderer = new WebGlRenderer(this, rendererConfig);
        this.renderingBackend = RenderingBackend.WEB_GL;
        this._textureFactory = new WebGlTextureFactory(this);
        this._geometryBuilder = new GeometryBuilder();
        this.renderPipelineFactory = new WebGlRenderPipelineFactory(this);
        this._contentManager = new ContentManager(this, new WebGlShaderModuleLoader(this));
        this._meshFactory = new MeshFactory(this);
        this.materialFactory = new MaterialFactory(this);

        this._buffersFactory = new WebGlBuffersFactory(this);
        this.spriteBatch = new SpriteBatch(this);
        this.cameraFactory = new CameraFactory(this);
        this.timeManager = new TimeManager();
        this.input = new InputManager(this);
        this.imageProcessor = new CpuImageProcessor();
        this.imageLoader = new ImageLoader(this);

        if(options.useKtx2){
            this.ktx2Factory = new Ktx2Factory();
        }
    }

    /** @inheritDoc */
    public readonly imageLoader: IImageLoader;

    renderingBackend: RenderingBackend;

    /** @inheritDoc */
    public readonly imageProcessor :IImageProcessor;

    /** @inheritDoc */
    public readonly renderer : IRenderer;

    /** @inheritDoc */
    public readonly spriteBatch: ISpriteBatch;

    /** @inheritDoc */
    public cameraFactory: ICameraFactory;

    /** @inheritDoc */
    public ktx2Factory?: IKtx2Factory;

    /** @inheritDoc */
    public addOnInitializedListener(event: () => void): void {
        this._onInitializeListeners.push(event);
    }

    /** @inheritDoc */
    public removeOnInitializedListener(event: () => void): void {
        Framework._removeListener(this._onInitializeListeners, event);
    }

    /** @inheritdoc */
    public addOnLoadContentListener(event: () => void): void {
        this._onLoadContentListeners.push(event);
    }

    /** @inheritdoc */
    public removeOnLoadContentListener(event: () => void): void {
        Framework._removeListener(this._onLoadContentListeners, event);
    }

    /** @inheritdoc */
    public addOnUpdateListener(event: (gameTime: GameTime) => void): void {
        this._onUpdateListeners.push(event);
    }

    /** @inheritdoc */
    public removeOnUpdateListener(event: (gameTime: GameTime) => void): void {
        Framework._removeListener(this._onUpdateListeners, event);
    }

    /** @inheritdoc */
    public addOnRenderListener(event: () => void): void {
        this._onRenderListeners.push(event);
    }

    /** @inheritdoc */
    public removeOnRenderListener(event: () => void): void {
        Framework._removeListener(this._onRenderListeners, event);
    }

    /**
     * Removes a listener if it is registered. An unknown listener is ignored,
     * instead of `splice(-1, 1)` removing the last registered one.
     */
    private static _removeListener<T>(listeners: T[], listener: T): void {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
            listeners.splice(index, 1);
        }
    }

    /** @inheritdoc */
    public get graphicsDevice(): IGraphicsDevice {
        return this.renderer.graphicsDevice;
    }

    /** @inheritdoc */
    public renderPipelineFactory: IRenderPipelineFactory;

    /** @inheritdoc */
    get geometryBuilder(): IGeometryBuilder {
        return this._geometryBuilder;
    }

    /** @inheritdoc */
    public readonly windowManager: IWindowManager;

    /** @inheritdoc */
    public get textureFactory(): ITextureFactory {
        return this._textureFactory;
    }

    /** @inheritdoc */
    public get bufferFactory(): IBufferFactory {
        return this._buffersFactory;
    }

    /** @inheritdoc */
    public get content(): IContentManager {
        return this._contentManager;
    }

    /** @inheritdoc */
    public get meshFactory(): IMeshFactory {
        return this._meshFactory;
    }

    /** @inheritDoc */
    public readonly materialFactory: IMaterialFactory;

    /** @inheritDoc */
    public readonly timeManager: ITimeManager;

    /** @inheritDoc */
    public readonly input: IInputManager;

    /** @inheritdoc */
    public initialize(): void {

        if(this.ktx2Factory) {
            this.ktx2Factory.initializeAsync();
        }

        (this.renderer as WebGlRenderer).initialize();
        this.spriteBatch.initialize();
        this.input.initialize();

        this.timeManager.prepareStart();

        // Load content events.
        for(const listener of this._onLoadContentListeners){
            listener();
        }

        for(const listener of this._onInitializeListeners){
            listener();
        }

        this.renderer.afterInitialize();

        this.windowManager.addUpdateListener(() => {
            // Update logic here
            this.timeManager.frameStart();
            this.input.update();

            for(const listener of this._onUpdateListeners){
                listener(this.timeManager.time);
            }

            this.input.afterUpdate();
        });
        this.windowManager.addRenderListener(() => {
            this.renderer.beginRenderPass();

            // Invoke render listeners.
            for (const listener of this._onRenderListeners) {
                listener();
            }

            this.spriteBatch.frameEnd();
            this.renderer.endRenderPass();
        });
        this.windowManager.runEventLoop();
    }

    /** @inheritDoc */
    public dispose() {
       //  this.windowManager.dispose();

        // TODO: dispose of other resources
    }
}
