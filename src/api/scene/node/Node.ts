/**
 * A node in a hierarchy. A node has at most one parent; use {@link addChild} and {@link removeChild}
 * to change the hierarchy (they keep `parent` and `children` in sync).
 * @public
 */
export class Node {

    private readonly _children: Node[] = [];
    private _parent?: Node;

    /** The child nodes of this node. */
    public get children(): readonly Node[] {
        return this._children;
    }

    /** The parent node of this node, if any. */
    public get parent(): Node | undefined {
        return this._parent;
    }

    /**
     * Adds a child. It is removed from its previous parent first. Adding an existing child does nothing.
     * @param child The child to add.
     * @throws Error when adding the node to itself or to one of its descendants.
     */
    public addChild(child: Node): void {
        if (child._parent === this) {
            return;
        }
        for (let n: Node | undefined = this; n; n = n._parent) {
            if (n === child) {
                throw new Error("Node.addChild: a node cannot be added to itself or to one of its descendants.");
            }
        }
        child._parent?.removeChild(child);
        child._parent = this;
        this._children.push(child);
    }

    /**
     * Removes a child.
     * @param child The child to remove.
     * @returns True when it was a child of this node.
     */
    public removeChild(child: Node): boolean {
        const index = this._children.indexOf(child);
        if (index < 0) {
            return false;
        }
        this._children.splice(index, 1);
        child._parent = undefined;
        return true;
    }
}
