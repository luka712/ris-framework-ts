import type { vec2 } from "gl-matrix";
import {CanvasBounds, type ICanvasManager} from "../index.ts";

/**
 * The implementation of the ICanvasManager interface.
 */
export class CanvasManager implements ICanvasManager {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _updateCallbacks: Array<() => void> = [];
  private readonly _renderCallbacks: Array<() => void> = [];
  private readonly _ownsCanvas: boolean;
  private _animationFrame: number | null = null;
  private _disposed = false;

  /**
   * The constructor for the CanvasManager class.
   * @param canvas An optional HTMLCanvasElement to associate with the window manager. If `null`, the window manager creates its own canvas and appends it to `document.body`.
   */
  public constructor(canvas: HTMLCanvasElement | null = null) {
    this._canvas = canvas ?? document.createElement("canvas");
    this._ownsCanvas = !canvas;
    if (!canvas) {
      document.body.appendChild(this._canvas);
    }
  }

  /** @inheritdoc */
  handleSwapChain = true;
    /** @inheritdoc */
    canvasBounds = new CanvasBounds();
    /** @inheritdoc */
    title = "";
    /** @inheritdoc */
    addUpdateListener(event: () => void): void {
        this._updateCallbacks.push(event);
    }
    /** @inheritdoc */
    removeUpdateListener(event: () => void): void {
        const index = this._updateCallbacks.indexOf(event);
        if (index >= 0) {
            this._updateCallbacks.splice(index, 1);
        }
    }
    /** @inheritdoc */
    addRenderListener(event: () => void): void {
        this._renderCallbacks.push(event);
    }
    /** @inheritdoc */
    removeRenderListener(event: () => void): void {
        const index = this._renderCallbacks.indexOf(event);
        if (index >= 0) {
            this._renderCallbacks.splice(index, 1);
        }
    }
    /** Not implemented yet; always throws. */
    addOnResizeListener(_event: (arg1: ICanvasManager, arg2: vec2) => void): void {
        throw new Error("CanvasManager.addOnResizeListener: Not implemented.");
    }
    /** Not implemented yet; always throws. */
    removeOnResizeListener(_event: (arg1: ICanvasManager, arg2: vec2) => void): void {
        throw new Error("CanvasManager.removeOnResizeListener: Not implemented.");
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
