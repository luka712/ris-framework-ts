/**
 * Capabilities of the touch panel.
 * Fields stay on this instance. Update them in place when the device changes.
 */
export class TouchPanelCapabilities {

    /**
     * The constructor.
     * @param isConnected True when a touch device is connected.
     * @param maximumTouchCount The maximum number of simultaneous touches. 0 when none are supported.
     * @param hasPressure True when contacts report pressure.
     */
    public constructor(public isConnected: boolean,
                       public maximumTouchCount: number,
                       public hasPressure: boolean) {
    }

    /**
     * Writes new capabilities into this instance.
     * @param isConnected True when a touch device is connected.
     * @param maximumTouchCount The maximum number of simultaneous touches. 0 when none are supported.
     * @param hasPressure True when contacts report pressure.
     */
    public set(isConnected: boolean,
               maximumTouchCount: number,
               hasPressure: boolean): void {
        this.isConnected = isConnected;
        this.maximumTouchCount = maximumTouchCount;
        this.hasPressure = hasPressure;
    }
}
