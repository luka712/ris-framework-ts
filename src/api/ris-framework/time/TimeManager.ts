import {GameTime} from "./GameTime";

/**
 * The time manager.
 */
export class TimeManager {

    private readonly _gameTime = new GameTime();
    private _lastFrameTime = Date.now();

    /** @inheritDoc */
    public get time(): GameTime {
        return this._gameTime;
    }

    /** @inheritDoc */
    public prepareStart(): void {
     this._gameTime.elapsedTimeMs = 0;
     this._lastFrameTime = Date.now();
    }

    /** @inheritDoc */
    public frameStart(): void {
        const currentTime = Date.now();

        const deltaTime = (currentTime - this._lastFrameTime);

        this._gameTime.deltaTimeMs = deltaTime;
        this._gameTime.elapsedTimeMs += deltaTime;

        this._lastFrameTime = currentTime;
    }
}
