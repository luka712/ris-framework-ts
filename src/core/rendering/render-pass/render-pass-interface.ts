import type {IDisposable} from "ris-framework-api";

/**
 * Defines the interface for a render pass, which encapsulates the operations and state management required to execute a rendering sequence.
 */
export interface IRenderPass extends IDisposable {

    /**
     * Begins the render pass, setting up necessary state and resources for rendering. 
     */
    beginPass(): void;

    /**
     * Ends the render pass, finalizing any rendering operations and cleaning up resources as needed.
     */
    endPass(): void;    
}