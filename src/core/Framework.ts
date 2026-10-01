import {container, type DependencyContainer} from "tsyringe";
import {WindowManager} from "./window/window-manager.ts";
import {FrameworkConfig} from "./FrameworkConfig.ts";
import {IFrameworkSymbol} from "./dependency-injection/register-services-interface.ts";
import { RenderConfiguration, RenderConfigurationSymbol} from "./renderer/renderer-interface.ts";
import {GeometryBuilder} from "../geometry/GeometryBuilder.ts";
import {ContentManager} from "./content/ContentManager.ts";
import {WebGlRenderer} from "../webgl/WebGlRenderer.ts";
import {WebGlBuffersFactory} from "../webgl/buffers/WebGlBuffersFactory.ts";
import {
    CameraFactory, CpuImageProcessor, GameTime,
    type IBufferFactory, type IGeometryBuilder, type IGraphicsDevice, type IImageProcessor, type IInputManager,
    ImageLoader,
    type IMeshFactory, type ISpriteBatch, type ITextureFactory, type ITimeManager, RenderingBackend, TimeManager
} from "ris-framework-api";
import {WebGlShaderModuleLoader} from "../webgl/shader/WebGlShaderModuleLoader.ts";
import {TextureSamplerFilteringPreset} from "./rendering/enums.ts";
import {SpriteBatch} from "./sprite-batch/SpriteBatch.ts";
import type {ICameraFactory, IContentManager, IFramework, IImageLoader,
    IRenderer,
    IWindowManager
} from "ris-framework-api";
import {WebGlTextureFactory} from "../webgl/texture/WebGlTextureFactory.ts";
import {WebGlRenderPipelineFactory} from "../webgl/render-pipelines/WebGlRenderPipelineFactory.ts";
import type {IRenderPipelineFactory} from "ris-framework-api";
import {MeshFactory, type IMaterialFactory, MaterialFactory} from "ris-framework-api";
import {InputManager} from "./input/InputManager.ts";
import {Ktx2Factory} from "ris-ktx2";
import type {IKtx2Factory} from "ris-ktx2-api";

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
     * @param options The optional options for them framework.
     */
    constructor(options: FrameworkConfig | null = null) {
        options = options ?? new FrameworkConfig();

        this._container = container.createChildContainer();
        this.windowManager = new WindowManager(options.canvas);

        // Setup container.
        this._container.registerInstance(IFrameworkSymbol, this);
        const rendererConfig = new RenderConfiguration();
        rendererConfig.backBufferSize = options.backBufferSize;
        rendererConfig.textureFiltering = options.textureFiltering ?? TextureSamplerFilteringPreset.BILINEAR;
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
        this._onInitializeListeners.splice(this._onInitializeListeners.indexOf(event), 1);
    }

    /** @inheritdoc */
    public addOnLoadContentListener(event: () => void): void {
        this._onLoadContentListeners.push(event);
    }

    /** @inheritdoc */
    public removeOnLoadContentListener(event: () => void): void {
        this._onLoadContentListeners.splice(this._onLoadContentListeners.indexOf(event), 1);
    }

    /** @inheritdoc */
    public addOnUpdateListener(event: (gameTime: GameTime) => void): void {
        this._onUpdateListeners.push(event);
    }

    /** @inheritdoc */
    public removeOnUpdateListener(event: (gameTime: GameTime) => void): void {
        this._onUpdateListeners.splice(this._onUpdateListeners.indexOf(event), 1);
    }

    /** @inheritdoc */
    public addOnRenderListener(event: () => void): void {
        this._onRenderListeners.push(event);
    }

    /** @inheritdoc */
    public removeOnRenderListener(event: () => void): void {
        this._onRenderListeners.splice(this._onRenderListeners.indexOf(event), 1);
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

        this.ktx2Factory?.initializeAsync();
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
