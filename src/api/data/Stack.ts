/**
 * A simple last-in, first-out (LIFO) stack implementation.
 *
 * Provides basic stack operations for adding, inspecting, and removing items.
 *
 * @internal
 */
export class Stack<T> {

    private _data: Array<T> = [];

    /**
     * Returns the item at the top of the stack without removing it.
     *
     * @returns The top item, or `undefined` if the stack is empty.
     */
    public peek(): T | undefined {
        return this._data[this._data.length - 1];
    }

    /**
     * Adds an item to the top of the stack.
     *
     * @param item The item to add.
     */
    public push(item: T): void {
        this._data.push(item);
    }

    /**
     * Removes and returns the item at the top of the stack.
     *
     * @returns The removed item, or `undefined` if the stack is empty.
     */
    public pop(): T | undefined {
        return this._data.pop();
    }
}