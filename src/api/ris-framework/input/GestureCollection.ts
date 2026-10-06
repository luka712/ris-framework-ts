import {GestureSample} from "./GestureSample";
import {GestureType} from "./GestureType";

/**
 * Gestures recognized for one frame.
 */
export class GestureCollection {

    /**
     * The constructor.
     * @param _gestures The gesture samples.
     */
    public constructor(private readonly _gestures: GestureSample[]) {
    }

    /** Gets the list of gesture samples. */
    public get gestures(): GestureSample[] {
        return this._gestures;
    }

    /** The number of gesture samples. */
    public get count(): number {
        return this._gestures.length;
    }

    /**
     * Gesture samples of one type.
     * @param gestureType The gesture type.
     */
    public ofType(gestureType: GestureType): GestureSample[] {
        const matches: GestureSample[] = [];
        for (const gesture of this._gestures) {
            if (gesture.gestureType === gestureType) {
                matches.push(gesture);
            }
        }
        return matches;
    }

    /**
     * True when the enabled set includes the gesture.
     * GestureType.NONE is included only when no gestures are enabled.
     * A combined value is included only when every bit is enabled.
     * @param enabled The enabled gestures.
     * @param gesture The gesture to test.
     */
    public static isEnabled(enabled: GestureType, gesture: GestureType): boolean {
        if (gesture === GestureType.NONE) {
            return enabled === GestureType.NONE;
        }
        return (enabled & gesture) === gesture;
    }
}
