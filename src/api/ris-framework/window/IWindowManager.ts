import {IDisposable} from "../core/IDisposable";
import {WindowBounds} from "./WindowBounds";
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
     * Update event.
     */
    addUpdateListener(event: () => void): void;

    /**
     * Update event.
     */
    removeUpdateListener(event: () => void): void;

    /**
     * Render event.
     */
    addRenderListener(event: () => void): void;

    /**
     * Render event.
     */
    removeRenderListener(event: () => void): void;

    /**
     * Called when the window is resized.
     */
    addOnResizeListener(event: (arg1: IWindowManager, arg2: vec2) => void): void;

    /**
     * Called when the window is resized.
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
