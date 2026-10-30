/**
 * Minimal hand-written WebGPU type declarations used by the WebGPU backend.
 *
 * TypeScript 5.9's `lib.dom` does not ship the WebGPU API, and the project avoids adding `@webgpu/types`.
 * The types are module-scoped (prefixed with `Gpu`) instead of global, so they never clash with `@webgpu/types`
 * in a consumer's project. Only what the backend uses is declared.
 * @internal
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/** `GPUBufferUsage` flags. */
export const GpuBufferUsage = {
    MAP_READ: 0x0001,
    MAP_WRITE: 0x0002,
    COPY_SRC: 0x0004,
    COPY_DST: 0x0008,
    INDEX: 0x0010,
    VERTEX: 0x0020,
    UNIFORM: 0x0040,
    STORAGE: 0x0080,
    INDIRECT: 0x0100,
    QUERY_RESOLVE: 0x0200,
} as const;

/** `GPUTextureUsage` flags. */
export const GpuTextureUsage = {
    COPY_SRC: 0x01,
    COPY_DST: 0x02,
    TEXTURE_BINDING: 0x04,
    STORAGE_BINDING: 0x08,
    RENDER_ATTACHMENT: 0x10,
} as const;

/** `GPUShaderStage` flags. */
export const GpuShaderStage = {
    VERTEX: 0x1,
    FRAGMENT: 0x2,
    COMPUTE: 0x4,
} as const;

export type GpuTextureFormat = string;
export type GpuPowerPreference = "low-power" | "high-performance";
export type GpuLoadOp = "load" | "clear";
export type GpuStoreOp = "store" | "discard";
export type GpuIndexFormat = "uint16" | "uint32";
export type GpuPrimitiveTopology = "point-list" | "line-list" | "line-strip" | "triangle-list" | "triangle-strip";
export type GpuCullMode = "none" | "front" | "back";
export type GpuFrontFace = "ccw" | "cw";
export type GpuBlendFactor = "zero" | "one" | "src-alpha" | "one-minus-src-alpha" | string;
export type GpuBlendOperation = "add" | "subtract" | "reverse-subtract" | "min" | "max";
export type GpuAddressMode = "clamp-to-edge" | "repeat" | "mirror-repeat";
export type GpuFilterMode = "nearest" | "linear";
export type GpuCompareFunction = "never" | "less" | "equal" | "less-equal" | "greater" | "not-equal" | "greater-equal" | "always";
export type GpuVertexFormat = "float32" | "float32x2" | "float32x3" | "float32x4" | string;
export type GpuVertexStepMode = "vertex" | "instance";

export interface GpuObjectBase {
    label: string;
}

export interface GpuAdapterInfo {
    readonly vendor: string;
    readonly architecture: string;
    readonly device: string;
    readonly description: string;
}

export interface GpuSupportedFeatures {
    has(feature: string): boolean;
}

export interface Gpu {
    requestAdapter(options?: { powerPreference?: GpuPowerPreference }): Promise<GpuAdapter | null>;
    getPreferredCanvasFormat(): GpuTextureFormat;
}

export interface GpuAdapter {
    readonly features: GpuSupportedFeatures;
    readonly info?: GpuAdapterInfo;
    requestDevice(descriptor?: { label?: string; requiredFeatures?: string[] }): Promise<GpuDevice>;
}

export interface GpuError {
    readonly message: string;
}

export interface GpuDevice extends GpuObjectBase {
    readonly features: GpuSupportedFeatures;
    readonly queue: GpuQueue;
    readonly lost: Promise<{ reason: string; message: string }>;
    createBuffer(descriptor: { label?: string; size: number; usage: number; mappedAtCreation?: boolean }): GpuBuffer;
    createTexture(descriptor: {
        label?: string;
        size: [number, number, number?] | { width: number; height?: number; depthOrArrayLayers?: number };
        mipLevelCount?: number;
        sampleCount?: number;
        dimension?: "1d" | "2d" | "3d";
        format: GpuTextureFormat;
        usage: number;
    }): GpuTexture;
    createSampler(descriptor?: {
        label?: string;
        addressModeU?: GpuAddressMode;
        addressModeV?: GpuAddressMode;
        addressModeW?: GpuAddressMode;
        magFilter?: GpuFilterMode;
        minFilter?: GpuFilterMode;
        mipmapFilter?: GpuFilterMode;
        lodMinClamp?: number;
        lodMaxClamp?: number;
        compare?: GpuCompareFunction;
        maxAnisotropy?: number;
    }): GpuSampler;
    createBindGroupLayout(descriptor: { label?: string; entries: GpuBindGroupLayoutEntry[] }): GpuBindGroupLayout;
    createPipelineLayout(descriptor: { label?: string; bindGroupLayouts: GpuBindGroupLayout[] }): GpuPipelineLayout;
    createBindGroup(descriptor: { label?: string; layout: GpuBindGroupLayout; entries: GpuBindGroupEntry[] }): GpuBindGroup;
    createShaderModule(descriptor: { label?: string; code: string }): GpuShaderModule;
    createRenderPipeline(descriptor: GpuRenderPipelineDescriptor): GpuRenderPipeline;
    createCommandEncoder(descriptor?: { label?: string }): GpuCommandEncoder;
    pushErrorScope(filter: "validation" | "out-of-memory" | "internal"): void;
    popErrorScope(): Promise<GpuError | null>;
    addEventListener(type: "uncapturederror", listener: (event: { error: GpuError }) => void): void;
    destroy(): void;
}

export interface GpuQueue {
    submit(commandBuffers: GpuCommandBuffer[]): void;
    writeBuffer(buffer: GpuBuffer, bufferOffset: number, data: ArrayBufferLike | ArrayBufferView, dataOffset?: number, size?: number): void;
    writeTexture(
        destination: { texture: GpuTexture; mipLevel?: number; origin?: [number, number, number?] },
        data: ArrayBufferView | ArrayBufferLike,
        dataLayout: { offset?: number; bytesPerRow?: number; rowsPerImage?: number },
        size: [number, number, number?] | { width: number; height?: number; depthOrArrayLayers?: number }): void;
    copyExternalImageToTexture(
        source: { source: any; flipY?: boolean },
        destination: { texture: GpuTexture; mipLevel?: number; premultipliedAlpha?: boolean },
        copySize: [number, number, number?] | { width: number; height?: number; depthOrArrayLayers?: number }): void;
}

export interface GpuBuffer extends GpuObjectBase {
    readonly size: number;
    destroy(): void;
}

export interface GpuTexture extends GpuObjectBase {
    readonly width: number;
    readonly height: number;
    readonly format: GpuTextureFormat;
    createView(descriptor?: { label?: string; format?: GpuTextureFormat; dimension?: string }): GpuTextureView;
    destroy(): void;
}

export interface GpuTextureView extends GpuObjectBase {
    readonly __brand?: "GPUTextureView";
}

export interface GpuSampler extends GpuObjectBase {
    readonly __brand?: "GPUSampler";
}

export interface GpuBindGroupLayout extends GpuObjectBase {
    readonly __brand?: "GPUBindGroupLayout";
}

export interface GpuPipelineLayout extends GpuObjectBase {
    readonly __brand?: "GPUPipelineLayout";
}

export interface GpuBindGroup extends GpuObjectBase {
    readonly __brand?: "GPUBindGroup";
}

export interface GpuShaderModule extends GpuObjectBase {
    getCompilationInfo?(): Promise<{ messages: readonly { type: string; message: string; lineNum: number; linePos: number }[] }>;
}

export interface GpuRenderPipeline extends GpuObjectBase {
    readonly __brand?: "GPURenderPipeline";
}

export interface GpuCommandBuffer extends GpuObjectBase {
    readonly __brand?: "GPUCommandBuffer";
}

export interface GpuBindGroupLayoutEntry {
    binding: number;
    visibility: number;
    buffer?: { type?: "uniform" | "storage" | "read-only-storage"; hasDynamicOffset?: boolean; minBindingSize?: number };
    sampler?: { type?: "filtering" | "non-filtering" | "comparison" };
    texture?: { sampleType?: "float" | "unfilterable-float" | "depth" | "sint" | "uint"; viewDimension?: string; multisampled?: boolean };
}

export interface GpuBindGroupEntry {
    binding: number;
    resource: GpuSampler | GpuTextureView | { buffer: GpuBuffer; offset?: number; size?: number };
}

export interface GpuVertexBufferLayout {
    arrayStride: number;
    stepMode?: GpuVertexStepMode;
    attributes: { format: GpuVertexFormat; offset: number; shaderLocation: number }[];
}

export interface GpuBlendComponent {
    operation?: GpuBlendOperation;
    srcFactor?: GpuBlendFactor;
    dstFactor?: GpuBlendFactor;
}

export interface GpuColorTargetState {
    format: GpuTextureFormat;
    blend?: { color: GpuBlendComponent; alpha: GpuBlendComponent };
    writeMask?: number;
}

export interface GpuDepthStencilState {
    format: GpuTextureFormat;
    depthWriteEnabled?: boolean;
    depthCompare?: GpuCompareFunction;
}

export interface GpuRenderPipelineDescriptor {
    label?: string;
    layout: GpuPipelineLayout | "auto";
    vertex: { module: GpuShaderModule; entryPoint?: string; buffers?: GpuVertexBufferLayout[] };
    fragment?: { module: GpuShaderModule; entryPoint?: string; targets: GpuColorTargetState[] };
    primitive?: { topology?: GpuPrimitiveTopology; cullMode?: GpuCullMode; frontFace?: GpuFrontFace; stripIndexFormat?: GpuIndexFormat };
    depthStencil?: GpuDepthStencilState;
    multisample?: { count?: number };
}

export interface GpuRenderPassColorAttachment {
    view: GpuTextureView;
    resolveTarget?: GpuTextureView;
    clearValue?: { r: number; g: number; b: number; a: number };
    loadOp: GpuLoadOp;
    storeOp: GpuStoreOp;
}

export interface GpuRenderPassDepthStencilAttachment {
    view: GpuTextureView;
    depthClearValue?: number;
    depthLoadOp?: GpuLoadOp;
    depthStoreOp?: GpuStoreOp;
    stencilClearValue?: number;
    stencilLoadOp?: GpuLoadOp;
    stencilStoreOp?: GpuStoreOp;
}

export interface GpuRenderPassDescriptor {
    label?: string;
    colorAttachments: GpuRenderPassColorAttachment[];
    depthStencilAttachment?: GpuRenderPassDepthStencilAttachment;
}

export interface GpuCommandEncoder extends GpuObjectBase {
    beginRenderPass(descriptor: GpuRenderPassDescriptor): GpuRenderPassEncoder;
    finish(descriptor?: { label?: string }): GpuCommandBuffer;
}

export interface GpuRenderPassEncoder extends GpuObjectBase {
    setPipeline(pipeline: GpuRenderPipeline): void;
    setVertexBuffer(slot: number, buffer: GpuBuffer, offset?: number, size?: number): void;
    setIndexBuffer(buffer: GpuBuffer, format: GpuIndexFormat, offset?: number, size?: number): void;
    setBindGroup(index: number, bindGroup: GpuBindGroup): void;
    drawIndexed(indexCount: number, instanceCount?: number, firstIndex?: number, baseVertex?: number, firstInstance?: number): void;
    draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void;
    pushDebugGroup(label: string): void;
    popDebugGroup(): void;
    end(): void;
}

export interface GpuCanvasContext {
    configure(configuration: { device: GpuDevice; format: GpuTextureFormat; usage?: number; alphaMode?: "opaque" | "premultiplied" }): void;
    unconfigure(): void;
    getCurrentTexture(): GpuTexture;
}

/**
 * Returns `navigator.gpu`, or undefined when the browser has no WebGPU.
 */
export function getNavigatorGpu(): Gpu | undefined {
    if (typeof navigator === "undefined") {
        return undefined;
    }
    return (navigator as unknown as { gpu?: Gpu }).gpu ?? undefined;
}
