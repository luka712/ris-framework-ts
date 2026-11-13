/**
 * CanvasBounds represents the width and height of a canvas.
 * @param width - The width of a window. By default, it is 800.
 * @param height - The height of a window. By default, it is 600.
 */
export class CanvasBounds {

    /**
     * Creates window bounds with the given width and height.
     * @param width - The width of a window. By default, it is 800.
     * @param height - The height of a window. By default, it is 600.
     */
    public constructor(
        public readonly width: number = 800,
        public readonly height: number = 600) {
    }
}
