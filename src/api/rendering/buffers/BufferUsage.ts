/**
 * The buffer usage.
 */
export enum BufferUsage {
/**
 * No buffer usage is defined.
 */
  NONE = 0,
/**
 * Allow a buffer to be the vertex buffer in a draw operation.
 *     
 *     The corresponding binding in WGPU is WGPU_VERTEX.
 *     The corresponding usage in OpenGL/WebGL is GL_ELEMENT_ARRAY_BUFFER.
 */
  VERTEX = 1,
/**
 * The buffer is used as an index buffer in a draw operation.
 */
  INDEX = 2,
/**
 * Allow a buffer to be the uniform buffer in a draw operation.
 *     
 *     The corresponding binding in WGPU is WGPU_UNIFORM.
 */
  UNIFORM = 4,
/**
 * Allow a buffer to be the storage buffer in a draw operation.
 *     
 *     In WGPU this will resolve to WGPU_STORAGE.
 *     
 *     In OpenGL this will resolve to GL_SHADER_STORAGE_BUFFER.
 *     
 *     In D3D11 this will resolve to usage D3D11_USAGE_DEFAULT.
 *     
 *     In D3D11 this will resolve to bind flags D3D11_BIND_SHADER_RESOURCE | D3D11_BIND_UNORDERED_ACCESS.
 *     
 *     In D3D11 this will resolve to misc flags D3D11_RESOURCE_MISC_BUFFER_STRUCTURED.
 */
  STORAGE = 8,
/**
 * Buffer is allowed to be read from.
 *     
 *     A common use case is copying data from the buffer to the CPU memory.
 *     
 *     The corresponding binding in WGPU is WGPU_MAP_READ.
 */
  MAP_READ = 16,
/**
 * Buffer is used as a destination for copying.
 *     
 *     A common use case is writing data to a buffer.
 *     
 *     The corresponding binding in WGPU is WGPU_COPY_DST.
 */
  COPY_DST = 32
}
