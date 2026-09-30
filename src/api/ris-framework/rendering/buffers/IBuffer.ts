import {BufferUsage} from "./BufferUsage";
import {IDisposable} from "../../core/IDisposable";

/**
 * The common interface for all buffers.
 */
export interface IBuffer extends IDisposable {

/**
 * The label of the buffer.
 */
  readonly label?: string;

/**
 * Size of the buffer in bytes.
 */
  readonly byteSize: number;

  /**
   * The usage of the buffer.
   */
  readonly usage: BufferUsage;

}
