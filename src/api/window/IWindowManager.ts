import type { IDisposable } from "../core/IDisposable.ts";
import {WindowBounds} from "./WindowBounds.ts";
import {vec2} from "gl-matrix";

/**
 * The interface for the window manager.
 */
export interface IWindowManager extends IDisposable {

    /**
     * Gets the HTMLCanvasElement associated with this WindowManager.
     */
    get canvas(): HTMLCanvasElement;

    /**
     * If the window manager handles the swap chain.
     * In some cases we don't want to handle the swap chain, for example, when embedding the framework into other applications,
     * such as Avalonia.
     * By default, it is true.
     */
    readonly handleSwapChain: boolean;

    /**
     * The client bounds or client window size.
     */
    readonly windowBounds: WindowBounds;

    /**
     * Gets or sets the title of the window.
     */
    title: string;

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
    addOnResizeListener(event: (arg1: IWindowManager, arg2: vec2) => void): void;

    /**
     * Removes a resize listener.
     */
    removeOnResizeListener(event: (arg1: IWindowManager, arg2: vec2) => void): void;

    /**
     * Initialize the window manager for WebGPU.
     */
    initializeForWebGPU(): void;

    /**
     * The initialization for WebGL.
     */
    initializeForWebGl(): void;

    /**
     * Runs the event loop.
     */
    runEventLoop(): void;

}
