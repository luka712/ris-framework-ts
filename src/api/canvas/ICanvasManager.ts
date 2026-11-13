import type { IDisposable } from "../core/IDisposable.ts";
import {CanvasBounds} from "./CanvasBounds.ts";
import {vec2} from "gl-matrix";

/**
 * Owns the canvas and the per-frame event loop.
 */
export interface ICanvasManager extends IDisposable {

    /** The canvas the framework renders to. */
    readonly canvas: HTMLCanvasElement;

    /**
     * If the canvas manager handles the swap chain.
     * In some cases we don't want to handle the swap chain, for example, when embedding the framework into other applications,
     * such as Avalonia.
     * By default, it is true.
     */
    readonly handleSwapChain: boolean;

    /** The client bounds or client window size. */
    readonly canvasBounds: CanvasBounds;

    /** If true event loop is running, false otherwise. */
    readonly eventLoopRunning: boolean;

    /**
     * Adds a listener that runs on every frame, before the render listeners.
     */
    addUpdateListener(event: () => void): void;

    /**
     * Removes an update listener. An unknown listener is ignored.
     */
    removeUpdateListener(event: () => void): void;

    /**
     * Adds a listener that runs on every frame, after the update listeners.
     */
    addRenderListener(event: () => void): void;

    /**
     * Removes a render listener. An unknown listener is ignored.
     */
    removeRenderListener(event: () => void): void;

    /**
     * Adds a listener that is called when the window is resized.
     */
    addOnResizeListener(event: (arg1: ICanvasManager, arg2: vec2) => void): void;

    /**
     * Removes a resize listener.
     */
    removeOnResizeListener(event: (arg1: ICanvasManager, arg2: vec2) => void): void;

    /** Starts the event loop: runs one frame now, then one per animation frame. Does nothing when it is already running. */
    runEventLoop(): void;

    /** Stops the event loop; no further frame runs until {@link runEventLoop} is called again. */
    stopEventLoop(): void;
}
