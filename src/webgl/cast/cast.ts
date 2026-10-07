import type {IBlendState, IIndexBuffer, ITexture2D, IUniformBuffer, IVertexBuffer} from "../../api/index.ts";
import type { ITempRenderer } from "../../core/renderer/renderer-interface";
import { WebGlBlendState } from "../blending/webgl-blend-state";
import { WebGLIndexBuffer } from "../buffers/webgl-index-buffer";
import { WebGlUniformBuffer } from "../buffers/WebGlUniformBuffer.ts";
import { WebGlVertexBuffer } from "../buffers/WebGlVertexBuffer.ts";
import { WebGlTexture2D } from "../texture/WebGlTexture2D.ts";
import { WebGlGraphicsDevice } from "../WebGlGraphicsDevice.ts";
import { WebGlRenderer } from "../WebGlRenderer.ts";

/**
 * Casts the given renderer to a WebGLRenderer. If the renderer is not a WebGLRenderer, an error is thrown.
 * @param renderer The renderer to cast.
 * @returns The given renderer casted to a WebGLRenderer.
 */
export function asWebGLRenderer(renderer: ITempRenderer): WebGlRenderer {
    if (renderer instanceof WebGlRenderer) {
        return renderer;
    } else {
        throw new Error("Renderer is not a WebGLRenderer.");
    }
}

/**
 * Casts the given texture to a WebGLTexture2D. If the texture is not a WebGLTexture2D, an error is thrown.
 * @param texture The texture to cast.
 * @returns The given texture casted to a WebGLTexture2D.
 */
export function asWebGLTexture2D(texture: ITexture2D): WebGlTexture2D {
    if (texture instanceof WebGlTexture2D) {
        return texture;
    } else {
        throw new Error("Texture is not a WebGLTexture2D.");
    }
}

/**
 * Casts the given vertex buffer to a WebGLVertexBuffer. If the vertex buffer is not a WebGLVertexBuffer, an error is thrown.
 * @param vertexBuffer The vertex buffer to cast.
 * @returns The given vertex buffer casted to a WebGLVertexBuffer.
 */
export function asWebGLVertexBuffer(vertexBuffer: IVertexBuffer): WebGlVertexBuffer {
    if (vertexBuffer instanceof WebGlVertexBuffer) {
        return vertexBuffer;
    } else {
        throw new Error("Vertex buffer is not a WebGLVertexBuffer.");
    }
}

/**
 * Casts the given index buffer to a WebGLIndexBuffer. If the index buffer is not a WebGLIndexBuffer, an error is thrown.
 * @param indexBuffer The index buffer to cast.
 * @returns The given index buffer cast to a WebGLIndexBuffer.
 */
export function asWebGLIndexBuffer(indexBuffer: IIndexBuffer): WebGLIndexBuffer {
    if (indexBuffer instanceof WebGLIndexBuffer) {
        return indexBuffer;
    } else {
        throw new Error("Index buffer is not a WebGLIndexBuffer.");
    }
}

/**
 * Casts the given uniform buffer to a WebGLUniformBuffer. If the uniform buffer is not a WebGLUniformBuffer, an error is thrown.
 * @param uniformBuffer The uniform buffer to cast.
 * @returns The given uniform buffer casted to a WebGLUniformBuffer.
 */
export function asWebGLUniformBuffer(uniformBuffer: IUniformBuffer): WebGlUniformBuffer {
    if (uniformBuffer instanceof WebGlUniformBuffer) {
        return uniformBuffer;
    } else {
        throw new Error("Uniform buffer is not a WebGLUniformBuffer.");
    }
}

/**
 * Casts the given graphics device to a WebGLGraphicsDevice. If the graphics device is not a WebGLGraphicsDevice, an error is thrown.
 * @param graphicsDevice The graphics device to cast.
 * @returns The given graphics device casted to a WebGLGraphicsDevice.
 */
export function asWebGLGraphicsDevice(graphicsDevice: ITempRenderer["graphicsDevice"]): WebGlGraphicsDevice {
    if (graphicsDevice instanceof WebGlGraphicsDevice   ) {
        return graphicsDevice as WebGlGraphicsDevice;
    } else {
        throw new Error("Graphics device is not a WebGL graphics device.");
    }   
}

/**
 * Casts the given blend state to a WebGLBlendState. If the blend state is not a WebGLBlendState, an error is thrown.
 * @param blendState The blend state to cast.
 * @returns The given blend state casted to a WebGLBlendState.
 */
export function asWebGLBlendState(blendState: IBlendState): WebGlBlendState {
    if (blendState instanceof WebGlBlendState) {
        return blendState as WebGlBlendState;
    } else {
        throw new Error("Blend state is not a WebGL blend state.");
    }
}