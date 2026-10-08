/**
 * The utilities for aligning values.
 */

export class AlignUtilities {

    /**
     * Aligns the value to the specified alignment.
     * @param value - The value to align.
     * @param alignment - The alignment.
     * @returns The aligned value.
     */
    public static align(value: number, alignment: number): number {
        return (value + alignment - 1) & ~(alignment - 1);
    }

    /**
     * Creates a new aligned array or returns existing array if it's already aligned.
     * @param array The array to align.
     * @param alignment The alignment.
     * @returns The new aligned array.
     */
    public static alignArray(array: ArrayLike<number>, alignment: number): ArrayLike<number> {
        const len = this.align(array.length, alignment);
        
        if(len == array.length) {
            return array;
        }
        
        const newArray = new Array(len);
        
        // Copy array
        for (let i = 0; i < array.length; i++) {
            newArray[i] = array[i];
        }
        
        return newArray;
    }
}
