import { API_ENDPOINTS } from '@/core/constants';
import CryptoJS from 'crypto-js';
import fs from 'fs';
import type { 
  FileListParams, 
  FileInfo, 
  CreateFileParams, 
  CreateFileResponse,
  UploadUrlResponse,
  UploadCompleteResponse,
  OfflineDownloadParams,
  OfflineDownloadResponse,
  ChunkType,
  SupportedFileType,
  CommonResult
} from '@/types';
import type Request from '@/core/request';

/**
 * 文件服务类
 * 提供文件上传、下载、管理等功能
 */
export default class FileService {
  /** 请求实例 */
  private request: Request;

  /**
   * 构造函数
   * @param request 请求实例
   */
  constructor(request: Request) {
    this.request = request;
  }

  /**
   * 获取文件列表
   * @param params 查询参数
   * @returns 文件列表响应
   */
  async getFileList(params: FileListParams = {}): Promise<CommonResult<{
    fileList: FileInfo[];
    hasMore: boolean;
    lastFileId?: number;
  }>> {
    const response = await this.request.request({
      url: API_ENDPOINTS.FILE_LIST,
      method: 'GET',
      params,
    });

    return {
      success: response.ok,
      data: response.data,
      message: response.ok ? 'Success' : 'Failed',
    };
  }

  /**
   * 文件分片
   * 支持 File / Blob / Buffer / Uint8Array
   * @param file 文件对象
   * @param sliceSize 分片大小
   * @returns 分片数组
   */
  sliceFile(file: SupportedFileType, sliceSize: number): ChunkType[] {
    const chunks: ChunkType[] = [];
    let start = 0;

    // 获取文件大小
    const size = this.getFileSize(file);

    if (size <= 0) {
      return chunks;
    }

    // 检查文件类型和可用方法
    const hasSlice = file && typeof (file as any).slice === 'function';
    const hasSubarray = file && typeof (file as any).subarray === 'function';

    while (start < size) {
      const end = Math.min(start + sliceSize, size);
      let chunk: ChunkType;

      if (hasSlice) {
        // File 或 Blob 类型
        chunk = (file as File | Blob).slice(start, end);
      } else if (hasSubarray) {
        // Buffer 或 Uint8Array 类型
        chunk = (file as Buffer | Uint8Array).subarray(start, end);
      } else if (
        typeof Buffer !== 'undefined' &&
        Buffer.isBuffer &&
        Buffer.isBuffer(file)
      ) {
        // Buffer 类型
        chunk = (file as Buffer).subarray(start, end);
      } else if (file && (file as any).buffer instanceof ArrayBuffer) {
        // ArrayBuffer 视图
        const view = new Uint8Array((file as any).buffer);
        chunk = view.subarray(start, end);
      } else {
        // 回退方案：尝试使用 slice 或 subarray
        const fileAny = file as any;
        chunk = fileAny.slice ? fileAny.slice(start, end) : fileAny.subarray(start, end);
      }

      chunks.push(chunk);
      start = end;
    }

    return chunks;
  }

  /**
   * 获取文件大小
   * @param file 文件对象
   * @returns 文件大小
   */
  private getFileSize(file: SupportedFileType): number {
    if (typeof (file as any)?.size === 'number') {
      return (file as File | Blob).size;
    }
    if (typeof (file as any)?.length === 'number') {
      return (file as Buffer | Uint8Array).length;
    }
    if (typeof (file as any)?.byteLength === 'number') {
      return (file as ArrayBuffer).byteLength;
    }
    return 0;
  }

  /**
   * 根据文件路径计算MD5
   * @param filePath 文件路径
   * @returns 文件MD5值
   */
  async calculateFileMD5FromPath(filePath: string): Promise<string> {
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
   * 创建文件
   * @param params 创建文件参数
   * @returns 创建结果
   */
  async createFile(params: CreateFileParams): Promise<CreateFileResponse> {
    try {
      const response = await this.request.request<CreateFileResponse>({
        url: API_ENDPOINTS.FILE_CREATE,
        method: 'POST',
        data: params,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取单个文件详情
   * @param fileID 文件ID
   * @returns 文件详情
   */
  async getFileDetail(fileID: number): Promise<CommonResult<FileInfo>> {
    const response = await this.request.request({
      url: API_ENDPOINTS.FILE_DETAIL,
      method: 'GET',
      params: { fileID },
    });

    return {
      success: response.ok,
      data: response.data,
      message: response.ok ? 'Success' : 'Failed',
    };
  }

  /**
   * 获取上传地址
   * @param preuploadID 预上传ID
   * @param sliceNo 分片序号(从1开始)
   * @returns 上传地址
   */
  async getUploadUrl(preuploadID: string, sliceNo: number): Promise<UploadUrlResponse> {
    try {
      const response = await this.request.request<UploadUrlResponse>({
        url: API_ENDPOINTS.UPLOAD_URL,
        method: 'POST',
        data: { preuploadID, sliceNo },
      });

      return response.data;
    } catch (error) {
      console.error('获取上传地址失败');
      throw error;
    }
  }

  /**
   * 上传文件分片
   * @param presignedURL 预签名上传URL
   * @param chunk 文件分片
   * @returns 上传结果
   */
  async uploadChunk(presignedURL: string, chunk: ChunkType): Promise<any> {
    const response = await this.request.request({
      url: presignedURL,
      method: 'PUT',
      data: chunk,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      useCustomUrl: true,
      skipAuth: true,
    });

    return response;
  }

  /**
   * 列举已上传分片(文件比对)
   * @param preuploadID 预上传ID
   * @returns 已上传分片信息
   */
  async listUploadedChunks(preuploadID: string): Promise<CommonResult<{
    uploadedChunks: number[];
    totalChunks: number;
  }>> {
    try {
      //TODO: ts类型有误
      const response: any = await this.request.request({
        url: API_ENDPOINTS.LIST_UPLOADED_CHUNKS,
        method: 'GET',
        params: { preuploadID },
      });
console.log(response.code);
      return {
        success: response.code == 0,
        data: response.data,
        message: response.message ,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 完成上传
   * @param preuploadID 预上传ID
   * @returns 上传完成响应
   */
  async completeUpload(preuploadID: string): Promise<UploadCompleteResponse> {
    const response = await this.request.request({
      url: API_ENDPOINTS.COMPLETE_UPLOAD,
      method: 'POST',
      data: { preuploadID },
    });

    return response.data;
  }

  /**
   * 轮询获取上传结果
   * @param preuploadID 预上传ID
   * @returns 上传结果
   */
  async pollUploadResult(preuploadID: string): Promise<CommonResult<{
    completed: boolean;
    fileInfo?: FileInfo;
    progress?: number;
  }>> {
    try {
      const { data: response } = await this.request.request({
        url: API_ENDPOINTS.UPLOAD_RESULT,
        method: 'POST',
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

  /**
   * 重命名文件
   * @param fileID 文件ID
   * @param newName 新文件名
   * @returns 重命名结果
   */
  async renameFile(fileID: number, newName: string): Promise<CommonResult<FileInfo>> {
    const response = await this.request.request({
      url: API_ENDPOINTS.RENAME_FILE,
      method: 'POST',
      data: { fileID, newName },
    });

    return {
      success: response.ok,
      data: response.data,
      message: response.ok ? 'Success' : 'Failed',
    };
  }

  /**
   * 删除文件
   * @param fileIDs 文件ID数组
   * @returns 删除结果
   */
  async deleteFiles(fileIDs: number[]): Promise<CommonResult<{
    deletedCount: number;
    failedFiles: number[];
  }>> {
    const response = await this.request.request({
      url: API_ENDPOINTS.DELETE_FILE,
      method: 'POST',
      data: { fileIDs },
    });

    return {
      success: response.ok,
      data: response.data,
      message: response.ok ? 'Success' : 'Failed',
    };
  }

  /**
   * 创建文件夹
   * @param parentFileID 父目录ID
   * @param folderName 文件夹名称
   * @returns 创建结果
   */
  async createFolder(parentFileID: number, folderName: string): Promise<CommonResult<FileInfo>> {
    const response = await this.request.request({
      url: API_ENDPOINTS.FOLDER_CREATE,
      method: 'POST',
      data: { parentFileID, folderName },
    });

    return {
      success: response.ok,
      data: response.data,
      message: response.ok ? 'Success' : 'Failed',
    };
  }

  /**
   * 获取文件下载链接
   * @param fileID 文件ID
   * @returns 下载链接
   */
  async getDownloadUrl(fileID: number): Promise<CommonResult<{
    downloadUrl: string;
    expiresAt: string;
  }>> {
    const response = await this.request.request({
      url: API_ENDPOINTS.FILE_DOWNLOAD,
      method: 'GET',
      params: { fileID },
    });

    return {
      success: response.ok,
      data: response.data,
      message: response.ok ? 'Success' : 'Failed',
    };
  }

  /**
   * 创建离线下载任务
   * @param params 离线下载参数，包含 url / fileName / dirID / callBackUrl
   * @returns 任务ID
   */
  async createOfflineDownload(params: OfflineDownloadParams): Promise<CommonResult<OfflineDownloadResponse>> {
    try {
      //TODO:ts类型错误
      const response : any = await this.request.request<OfflineDownloadResponse>({
        url: API_ENDPOINTS.OFFLINE_DOWNLOAD,
        method: 'POST',
        data: params,
      });
  
      return {
        success: response.code == 0 ,
        data: response.data,
        message: response.message,
      };
    } catch (error) {
      throw error;
    }
  }
}
