export class WebGlErrorUtilities {

    private readonly _map: Record<number, string> = {
        1282: "INVALID_OPERATION"
    }

    /**
     * Maps the WebGL2 error code to string.
     * @param error The error code.
     * @return The string of error code.
     */
    public errorToStr(error: number) : string {
        return this._map[error] ?? error.toString();
    }
}