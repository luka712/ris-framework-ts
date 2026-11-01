import type {TransformNode} from "./node/TransformNode.ts";

/**
 * An object that can be placed in a scene: it has a transform.
 * @public
 */
export interface ISceneObject {

    /**
     * The transform node.
     */
    transform: TransformNode;
}
