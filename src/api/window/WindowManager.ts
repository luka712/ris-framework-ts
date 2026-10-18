import type { vec2 } from "gl-matrix";
import {WindowBounds, type IWindowManager} from "../index.ts";

/**
 * The implementation of the IWindowManager interface.
 */
export class WindowManager implements IWindowManager {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _updateCallbacks: Array<() => void> = [];
  private readonly _renderCallbacks: Array<() => void> = [];
  private readonly _ownsCanvas: boolean;
  private _animationFrame: number | null = null;
  private _disposed = false;

  /**
   * The constructor for the WindowManager class.
   * @param canvas An optional HTMLCanvasElement to associate with the window manager. If `null`, the window manager creates its own canvas and appends it to `document.body`.
   */
  public constructor(canvas: HTMLCanvasElement | null = null) {
    this._canvas = canvas ?? document.createElement("canvas");
    this._ownsCanvas = !canvas;
    if (!canvas) {
      document.body.appendChild(this._canvas);
    }
  }

  handleSwapChain = true;
    windowBounds = new WindowBounds();
    title = "";
    addUpdateListener(event: () => void): void {
        this._updateCallbacks.push(event);
    }
    removeUpdateListener(event: () => void): void {
        const index = this._updateCallbacks.indexOf(event);
        if (index >= 0) {
            this._updateCallbacks.splice(index, 1);
        }
    }
    addRenderListener(event: () => void): void {
        this._renderCallbacks.push(event);
    }
    removeRenderListener(event: () => void): void {
        const index = this._renderCallbacks.indexOf(event);
        if (index >= 0) {
            this._renderCallbacks.splice(index, 1);
        }
    }
    addOnResizeListener(_event: (arg1: IWindowManager, arg2: vec2) => void): void {
        throw new Error("Method not implemented.");
    }
    removeOnResizeListener(_event: (arg1: IWindowManager, arg2: vec2) => void): void {
        throw new Error("Method not implemented.");
    }
    initializeForWebGPU(): void {
        throw new Error("Method not implemented.");
    }
    initializeForWebGl(): void {
        throw new Error("Method not implemented.");
    }
    /** Stops the event loop, drops all callbacks and removes the canvas when this manager created it. */
    dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        if (this._animationFrame !== null) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
        this._updateCallbacks.length = 0;
        this._renderCallbacks.length = 0;
        if (this._ownsCanvas) {
            this._canvas.remove();
        }
    }

  /** @inheritdoc */
  runEventLoop(): void {
    if (this._disposed) {
      return;
    }
    for (const callback of this._updateCallbacks) {
      callback();
    }
    for (const callback of this._renderCallbacks) {
      callback();
    }

    this._animationFrame = requestAnimationFrame(() => this.runEventLoop());
  }

  /** @inheritdoc */
  public get canvas(): HTMLCanvasElement {
    return this._canvas;
  }
}
