import { API_ENDPOINTS, API_BASE_URL_WEB } from "../core/constants.js";
import CryptoJS from "crypto-js";
import fs from "fs";

export default class FileService {
  constructor(request) {
    this.request = request;
  }

  /**
   * 获取文件列表
   * @param {Object} params
   * @param {number} params.parentFileId - 文件夹ID，根目录传0
   * @param {number} params.limit - 每页文件数量，最大100
   * @param {string} [params.searchData] - 搜索关键字
   * @param {number} [params.searchMode] - 搜索模式：0-模糊，1-精准
   * @param {number} [params.lastFileId] - 翻页查询ID
   */
  async getFileList(params) {
    return await this.request.request({
      url: API_ENDPOINTS.FILE_LIST,
      method: "GET",
      params,
    });
  }

  /**
   * 文件分片
   * 支持 File / Blob / Buffer / Uint8Array
   * @param {any} file 文件对象
   * @param {number} sliceSize 分片大小
   * @returns {Array<Buffer|Blob|Uint8Array>} 分片数组
   */
  sliceFile(file, sliceSize) {
    const chunks = [];
    let start = 0;

    const size =
      typeof file?.size === "number"
        ? file.size
        : typeof file?.length === "number"
        ? file.length
        : 0;

    if (size <= 0) {
      return chunks;
    }

    const hasSlice = file && typeof file.slice === "function";
    const hasSubarray = file && typeof file.subarray === "function";

    while (start < size) {
      const end = Math.min(start + sliceSize, size);
      let chunk;

      if (hasSlice) {
        chunk = file.slice(start, end);
      } else if (hasSubarray) {
        chunk = file.subarray(start, end);
      } else if (
        typeof Buffer !== "undefined" &&
        Buffer.isBuffer &&
        Buffer.isBuffer(file)
      ) {
        chunk = file.subarray(start, end);
      } else if (file && file.buffer instanceof ArrayBuffer) {
        const view = new Uint8Array(file.buffer);
        chunk = view.subarray(start, end);
      } else {
        // Fallback: attempt to use slice on array-like
        chunk = file.slice ? file.slice(start, end) : file.subarray(start, end);
      }

      chunks.push(chunk);
      start = end;
    }

    return chunks;
  }

  /**
   * 根据文件路径计算MD5
   * @param {string} filePath 文件路径
   * @returns {Promise<string>} 文件MD5值
   */
  calculateFileMD5FromPath(filePath) {
    return new Promise((resolve, reject) => {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const wordArray = CryptoJS.lib.WordArray.create(fileBuffer);
        const md5 = CryptoJS.MD5(wordArray).toString();
        resolve(md5);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 1. 创建文件
   * @param {Object} params 参数
   * @param {number} params.parentFileID 父目录ID，上传到根目录填0
   * @param {string} params.filename 文件名
   * @param {string} params.etag 文件MD5
   * @param {number} params.size 文件大小(字节)
   * @param {number} [params.duplicate] 重名策略(1保留两者，2覆盖)
   * @param {boolean} [params.containDir] 是否包含路径，默认false
   * @returns {Promise<Object>} 创建结果
   */
  async createFile(params) {
    try {
      const response = await this.request.request({
        url: API_ENDPOINTS.FILE_CREATE,
        method: "POST",
        data: params,
      });

      return response;
    } catch (error) {
      throw error;
    }
  }
  /** 获取单个文件详情 */
  async getFileDetail(fileID) {
    return await this.request.request({
      url: API_ENDPOINTS.FILE_DETAIL,
      method: "GET",
      params: { fileID },
    });
  }
  /**
   * 2. 获取上传地址
   * @param {string} preuploadID 预上传ID
   * @param {number} sliceNo 分片序号(从1开始)
   * @returns {Promise<Object>} 上传地址
   */
  async getUploadUrl(preuploadID, sliceNo) {
    try {
      const response = await this.request.request({
        url: API_ENDPOINTS.PRESIGNED_URL,
        method: "POST",
        data: { preuploadID, sliceNo },
      });

      return response;
    } catch (error) {
      console.error("获取上传地址失败");

      throw error;
    }
  }

  /**
   * 3. 上传文件分片
   * @param {string} presignedURL 预签名上传URL
   * @param {Blob} chunk 文件分片
   * @returns {Promise<Object>} 上传结果
   */
  async uploadChunk(presignedURL, chunk) {
    const response = await this.request.request({
      url: presignedURL,
      method: "PUT",
      data: chunk,
      headers: {
        "Content-Type": "application/octet-stream",
      },
      useCustomUrl: true,
      skipAuth: true,
    });

    return response;
  }

  /**
   * 4. 列举已上传分片(文件比对)
   * @param {string} preuploadID 预上传ID
   * @returns {Promise<Object>} 已上传分片信息
   */
  async listUploadedChunks(preuploadID) {
    try {
      const response = await this.request.request({
        url: API_ENDPOINTS.CHUNKS_LIST,
        method: "GET",
        params: { preuploadID },
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 5. 上传完成
   * @param {string} preuploadID 预上传ID
   * @returns {Promise<Object>} 上传完成结果
   */
  async completeUpload(preuploadID) {
    try {
      const response = await this.request.request({
        url: API_ENDPOINTS.UPLOAD_COMPLETE,
        method: "POST",
        data: { preuploadID },
      });

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 6. 轮询获取上传结果
   * @param {string} preuploadID 预上传ID
   * @returns {Promise<Object>} 上传结果
   */
  async pollUploadResult(preuploadID) {
    try {
      const { data: response } = await this.request.request({
        url: API_ENDPOINTS.UPLOAD_RESULT,
        method: "POST",
        data: { preuploadID },
      });

      const result = response;
      const POLL_INTERVAL = 1000;

      if (!result.completed) {
        // 未完成，等待后继续轮询
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
        return this.pollUploadResult(preuploadID);
      }

      return result;
    } catch (error) {
      throw error;
    }
  }
}
