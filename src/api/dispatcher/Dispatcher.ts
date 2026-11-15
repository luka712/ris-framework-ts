import type { GameTime } from "../_export";
import type { IDispatcher } from "./IDispatcher";

/** TODO */
export class Dispatcher implements IDispatcher {

    private _updateActions: { [id: number]: Array<(gt: GameTime) => void> } = {};

    /** @inheritdoc */
    public currentFrame: number = 0;

    /** @inheritdoc */
    public addNextUpdateFrameAction(action: (gt: GameTime) => void): void {

        const nextFrame = this.currentFrame + 1;
        if (!this._updateActions[nextFrame]) {

            this._updateActions[nextFrame] = [action];
        }
        else {
            this._updateActions[nextFrame].push(action);
        }
    }

    /** @inheritdoc */
    public runUpdateActions(gt: GameTime): void {
        if (this._updateActions[this.currentFrame]) {
            for (const action of this._updateActions[this.currentFrame]) {
                action(gt);
            }

            delete this._updateActions[this.currentFrame];
        }
    }

}