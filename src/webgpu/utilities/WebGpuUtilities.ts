import { WebGpuAdapterUtilities } from "./WebGpuAdapterUtilities";
import { WebGpuBufferUtilities } from "./WebGpuBufferUtilities";
import { WebGpuDeviceUtilities } from "./WebGpuDeviceUtilities";
import {WebGpuContextUtilities} from "./WebGpuContextUtilities.ts";
import {WebGpuInstanceUtilities} from "./WebGpuInstanceUtilities.ts";
import {WebGpuTextureUtilities} from "./WebGpuTextureUtilities.ts";
import {WebGpuTextureViewUtilities} from "./WebGpuTextureViewUtilities.ts";
import {WebGpuSamplerUtilities} from "./WebGpuSamplerUtilities.ts";
import {WebGpuShaderModuleUtilities} from "./WebGpuShaderModuleUtilities.ts";
import {WebGpuBindGroupUtilities} from "./WebGpuBindGroupUtilities.ts";
import {WebGpuBindGroupLayoutUtilities} from "./WebGpuBindGroupLayoutUtilities.ts";
import {WebGpuBindGroupLayoutEntryUtilities} from "./WebGpuBindGroupLayoutEntryUtilities.ts";
import {WebGpuPipelineLayoutUtilities} from "./WebGpuPipelineLayoutUtilities.ts";
import {WebGpuRenderPipelineUtilities} from "./WebGpuRenderPipelineUtilities.ts";
import {WebGpuCommandEncoderUtilities} from "./WebGpuCommandEncoderUtilities.ts";
import type {IWebGpuLogger} from "./WebGpuLogger.ts";

/** The utilities for WebGPU. */
export class WebGpuUtilities {

  /**
   * Initializes the utilities, like C# `WebGPUUtilities.Initialize(logger)`.
   * @param logger The logger. By default, `console`. Null disables logging.
   */
  public static initialize(logger: IWebGpuLogger | null = console): void {
    WebGpuUtilities.texture.logger = logger;
    WebGpuUtilities.sampler.logger = logger;
    WebGpuUtilities.shaderModule.logger = logger;
    WebGpuUtilities.bindGroup.logger = logger;
    WebGpuUtilities.bindGroupLayout.logger = logger;
    WebGpuUtilities.pipelineLayout.logger = logger;
    WebGpuUtilities.renderPipeline.logger = logger;
  }

  /** The instance utilities. */
  public static readonly instance = new WebGpuInstanceUtilities();

    /** The adapter utilities. */
  public static readonly adapter = new WebGpuAdapterUtilities();

  /** The device utilities. */
  public static readonly device = new WebGpuDeviceUtilities();

  /** The buffer utilities. */
  public static readonly buffer = new WebGpuBufferUtilities();

  /** The context utilities. */
  public static readonly context = new WebGpuContextUtilities();

  /** The texture utilities. */
  public static readonly texture = new WebGpuTextureUtilities();

  /** The texture view utilities. */
  public static readonly textureView = new WebGpuTextureViewUtilities();

  /** The sampler utilities. */
  public static readonly sampler = new WebGpuSamplerUtilities();

  /** The shader module utilities. */
  public static readonly shaderModule = new WebGpuShaderModuleUtilities();

  /** The bind group utilities. */
  public static readonly bindGroup = new WebGpuBindGroupUtilities();

  /** The bind group layout utilities. */
  public static readonly bindGroupLayout = new WebGpuBindGroupLayoutUtilities();

  /** The bind group layout entry utilities. */
  public static readonly bindGroupLayoutEntry = new WebGpuBindGroupLayoutEntryUtilities();

  /** The pipeline layout utilities. */
  public static readonly pipelineLayout = new WebGpuPipelineLayoutUtilities();

  /** The render pipeline utilities. */
  public static readonly renderPipeline = new WebGpuRenderPipelineUtilities();

  /** The command encoder utilities. */
  public static readonly commandEncoder = new WebGpuCommandEncoderUtilities();
}
