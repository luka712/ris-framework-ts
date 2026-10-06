/**
 * Capabilities of the touch panel.
 */
export class TouchPanelCapabilities {

    /**
     * The constructor.
     * @param isConnected True when a touch device is connected.
     * @param maximumTouchCount The maximum number of simultaneous touches. 0 when none are supported.
     * @param hasPressure True when contacts report pressure.
     */
    public constructor(public readonly isConnected: boolean,
                       public readonly maximumTouchCount: number,
                       public readonly hasPressure: boolean) {
    }
}
