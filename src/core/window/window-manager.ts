import type { vec2 } from "gl-matrix";
import {WindowBounds, type IWindowManager} from "../../api/index.ts";

/**
 * The implementation of the IWindowManager interface.
 */
export class WindowManager implements IWindowManager {
  private readonly _canvas: HTMLCanvasElement;
  private readonly _updateCallbacks: Array<() => void> = [];
  private readonly _renderCallbacks: Array<() => void> = [];

  /**
   * The constructor for the WindowManager class.
   * @param canvas An optional HTMLCanvasElement to associate with the window manager. If <c>null</c>, window manager will create its own canvas.
   */
  public constructor(canvas: HTMLCanvasElement | null = null) {
    this._canvas = canvas ?? document.createElement("canvas");
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
    dispose(): void {
        throw new Error("Method not implemented.");
    }

  /** @inheritdoc */
  runEventLoop(): void {
    for (const callback of this._updateCallbacks) {
      callback();
    }
    for (const callback of this._renderCallbacks) {
      callback();
    }

    requestAnimationFrame(() => this.runEventLoop());
  }

  /** @inheritdoc */
  public get canvas(): HTMLCanvasElement {
    return this._canvas;
  }
}
