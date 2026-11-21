import { vec2 } from "gl-matrix";
import { CanvasBounds } from "./CanvasBounds.ts";
import type { ICanvasManager } from "./ICanvasManager.ts";

/**
 * Manages the canvas and the `requestAnimationFrame` event loop.
 * Each frame runs the update listeners, then the render listeners.
 */
export class CanvasManager implements ICanvasManager {
    private readonly _canvas: HTMLCanvasElement;
    private readonly _ownsCanvas: boolean;
    private readonly _updateListeners: Array<() => void> = [];
    private readonly _renderListeners: Array<() => void> = [];
    private readonly _resizeListeners: Array<(canvasManager: ICanvasManager, size: vec2) => void> = [];
    private readonly _size = vec2.create();
    private _animationFrame: number | null = null;
    private _running = false;
    private _disposed = false;

    /** @inheritdoc */
    public readonly handleSwapChain = true;

    /** @inheritdoc */
    public readonly canvasBounds = new CanvasBounds();

    /**
     * Creates the canvas manager.
     * @param canvas The canvas to use. When omitted, a new canvas is created, appended to `document.body`
     * and removed again on {@link dispose}.
     */
    public constructor(canvas?: HTMLCanvasElement | null) {
        this._ownsCanvas = !canvas;
        this._canvas = canvas ?? document.createElement("canvas");
        if (this._ownsCanvas) {
            document.body.appendChild(this._canvas);
        }
        vec2.set(this._size, this._canvas.width, this._canvas.height);
    }

    /** @inheritdoc */
    public get canvas(): HTMLCanvasElement {
        return this._canvas;
    }

    /** @inheritdoc */
    public get eventLoopRunning(): boolean {
        return this._running;
    }

    /** @inheritdoc */
    public addUpdateListener(listener: () => void): void {
        this._updateListeners.push(listener);
    }

    /** @inheritdoc */
    public removeUpdateListener(listener: () => void): void {
        CanvasManager._remove(this._updateListeners, listener);
    }

    /** @inheritdoc */
    public addRenderListener(listener: () => void): void {
        this._renderListeners.push(listener);
    }

    /** @inheritdoc */
    public removeRenderListener(listener: () => void): void {
        CanvasManager._remove(this._renderListeners, listener);
    }

    /**
     * Adds a listener that is called at the start of a frame when the canvas width or height changed.
     * @ai-generated
     */
    public addOnResizeListener(listener: (canvasManager: ICanvasManager, size: vec2) => void): void {
        this._resizeListeners.push(listener);
    }

    /**
     * Removes a resize listener. An unknown listener is ignored.
     * @ai-generated
     */
    public removeOnResizeListener(listener: (canvasManager: ICanvasManager, size: vec2) => void): void {
        const index = this._resizeListeners.indexOf(listener);
        if (index >= 0) {
            this._resizeListeners.splice(index, 1);
        }
    }

    /**
     * Runs one frame now and schedules the next ones with `requestAnimationFrame`.
     * Does nothing when the loop is already running or the manager is disposed.
     */
    public runEventLoop(): void {
        if (this._disposed || this._running) {
            return;
        }
        this._running = true;
        this._frame();
    }

    /** Stops the loop; no further frame runs. {@link runEventLoop} starts it again. */
    public stopEventLoop(): void {
        this._running = false;
        if (this._animationFrame !== null) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
    }

    /** Stops the event loop, drops all listeners and removes the canvas when this manager created it. Calling it twice does nothing. */
    public dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this.stopEventLoop();
        this._updateListeners.length = 0;
        this._renderListeners.length = 0;
        this._resizeListeners.length = 0;
        if (this._ownsCanvas) {
            this._canvas.remove();
        }
    }

    private _frame(): void {
        this._checkResize();

        // Iterate copies: a listener may add or remove listeners while the frame runs.
        for (const listener of this._updateListeners.slice()) {
            listener();
        }
        for (const listener of this._renderListeners.slice()) {
            listener();
        }
        // A listener may have stopped the loop or disposed the manager.
        if (!this._running) {
            return;
        }
        this._animationFrame = requestAnimationFrame(() => {
            this._animationFrame = null;
            this._frame();
        });
    }

    /**
     * Raises the resize listeners when the canvas width or height differs from the last frame.
     * @ai-generated
     */
    private _checkResize(): void {
        if (this._canvas.width == this._size[0] && this._canvas.height == this._size[1]) {
            return;
        }
        vec2.set(this._size, this._canvas.width, this._canvas.height);
        for (const listener of this._resizeListeners.slice()) {
            listener(this, this._size);
        }
    }

    private static _remove(listeners: Array<() => void>, listener: () => void): void {
        const index = listeners.indexOf(listener);
        if (index >= 0) {
            listeners.splice(index, 1);
        }
    }
}
