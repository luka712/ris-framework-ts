/**
 * The buffer usage.
 */
export enum BufferUsage {
/**
 * No buffer usage is defined.
 */
  NONE = 0,
/**
 * The buffer can be used as a vertex buffer in a draw operation.
 */
  VERTEX = 1,
/**
 * The buffer is used as an index buffer in a draw operation.
 */
  INDEX = 2,
/**
 * The buffer can be used as a uniform buffer in a draw operation.
 */
  UNIFORM = 4,
/**
 * The buffer can be used as a storage buffer in a draw operation.
 */
  STORAGE = 8,
/**
 * The buffer can be read from, for example to copy data to CPU memory.
 */
  MAP_READ = 16,
/**
 * The buffer can be a copy destination, for writing data.
 */
  COPY_DST = 32
}
