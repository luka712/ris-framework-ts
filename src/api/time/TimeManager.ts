import {GameTime} from "./GameTime.ts";
import type { ITimeManager } from "./ITimeManager.ts";

/**
 * The time manager.
 */
export class TimeManager implements ITimeManager {

    private readonly _gameTime = new GameTime();
    private _lastFrameTime = Date.now();
    private _currentFrame = 0;

    /** @inheritDoc */
    public get time(): GameTime {
        return this._gameTime;
    }

     /** @inheritDoc */
    public get currentFrame(): number {
        return this._currentFrame;
    }

    /** @inheritDoc */
    public prepareStart(): void {
     this._gameTime.elapsedTimeMs = 0;
     this._lastFrameTime = Date.now();
    }

    /** @inheritDoc */
    public frameStart(): void {
        this._currentFrame++;
        const currentTime = Date.now();

        const deltaTime = (currentTime - this._lastFrameTime);

        this._gameTime.deltaTimeMs = deltaTime;
        this._gameTime.elapsedTimeMs += deltaTime;

        this._lastFrameTime = currentTime;
    }
}
