import {RenderingBackend} from "./rendering/RenderingBackend.ts";
import type { ISpriteBatch } from "./sprites/ISpriteBatch.ts";
import type { IRenderer } from "./rendering/IRenderer.ts";
import type { IGraphicsDevice } from "./rendering/IGraphicsDevice.ts";
import type { IRenderPipelineFactory } from "./rendering/render-pipelines/IRenderPipelineFactory.ts";
import type { IBufferFactory } from "./rendering/buffers/IBufferFactory.ts";
import type { IGeometryBuilder } from "./geometry/IGeometryBuilder.ts";
import type { ICameraFactory } from "./camera/ICameraFactory.ts";
import type { ITextureFactory } from "./rendering/texture/ITextureFactory.ts";
import type { IContentManager } from "./content/IContentManager.ts";
import type { IImageLoader } from "./loaders/IImageLoader.ts";
import type { IMeshFactory } from "./meshes/IMeshFactory.ts";
import type { IMaterialFactory } from "./material/IMaterialFactory.ts";
import type { ITimeManager } from "./time/ITimeManager.ts";
import type { IInputManager } from "./input/IInputManager.ts";
import type { IWindowManager } from "./window/IWindowManager.ts";
import {GameTime} from "./time/GameTime.ts";
import type { IImageProcessor } from "./image/IImageProcessor.ts";
import type { IKtx2Factory } from "ris-ktx2-api";
import type { IDisposable } from "./core/IDisposable.ts";

/** The framework interface. */
export interface IFramework extends IDisposable {

    /**
     * The image loader.
     */
    readonly imageLoader: IImageLoader;

    /**
     * The used rendering backend.
     */
    readonly renderingBackend: RenderingBackend;

    /**
     * The sprite batches.
     */
    readonly spriteBatch: ISpriteBatch;

    /**
     * The renderer used by the framework.
     */
    readonly renderer: IRenderer;

    /**
     * The graphics device used by the framework.
     */
    readonly graphicsDevice: IGraphicsDevice;

    /**
     * The pipeline factory.
     * Responsible for creating low-level rendering pipelines.
     * Pipeline includes everything necessary to render some geometry
     * and can be thought of as a material or renderer.
     */
    readonly renderPipelineFactory: IRenderPipelineFactory;

    /**
     * The buffer factory, responsible for creating GPU memory buffers.
     */
    readonly bufferFactory: IBufferFactory;

    /**
     * The geometry builder.
     */
    readonly geometryBuilder: IGeometryBuilder;

    /** The texture factory. */
    readonly textureFactory: ITextureFactory;

    /** The KTX2 factory. Initialized only if KTX2 is requested or loaded. */
    readonly ktx2Factory?: IKtx2Factory;

    /**
     * The camera factory.
     */
    readonly cameraFactory: ICameraFactory;

    /**
     * The content manager.
     */
    readonly content: IContentManager;

    /**
     * The mesh factory.
     */
    readonly meshFactory: IMeshFactory;

    /**
     * The material factory.
     */
    readonly materialFactory: IMaterialFactory;

    /**
     * The time manager.
     */
    readonly timeManager: ITimeManager;

    /** The input manager. */
    readonly input: IInputManager;

    /** The window manager. */
    readonly windowManager: IWindowManager;

    /** The image processor. */
    readonly imageProcessor: IImageProcessor;

    /**
     * Called right after the framework is initialized and before the render loop starts.
     * Content can be loaded here.
     */
    addOnLoadContentListener(event: () => void): void;

    /**
     * Called right after the framework is initialized and before the render loop starts.
     * Content can be loaded here.
     */
    removeOnLoadContentListener(event: () => void): void;

    /**
     * Called when the framework is initialized.
     */
    addOnInitializedListener(event: () => void): void;

    /**
     * Called when the framework is initialized.
     */
    removeOnInitializedListener(event: () => void): void;

    /**
     * Called when framework is updated.
     */
    addOnUpdateListener(event: (gameTime: GameTime) => void): void;

    /**
     * Called when framework is updated.
     */
    removeOnUpdateListener(event: (gameTime: GameTime) => void): void;

    /**
     * Called when the framework is rendered.
     */
    addOnRenderListener(event: () => void): void;

    /**
     * Called when the framework is rendered.
     */
    removeOnRenderListener(event: () => void): void;

    /** Initializes the framework. */
    initialize(): void;

}
