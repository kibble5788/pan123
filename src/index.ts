import crypto from "crypto";
import fs from "fs";
import type {
  Pan123SDKConfig,
  FileListResponse,
  CreateFileResponse,
  UploadCompleteResponse,
  UploadResult,
  ApiResponse,
} from "./types";
import { TokenManager } from "./token-manager";
import { HttpClient } from "./http-client";

/**
 * 123云盘 SDK 主类
 */
export class Pan123SDK {
  private config: Required<Pan123SDKConfig>;
  private tokenManager: TokenManager;
  private httpClient: HttpClient;

  constructor(config: Pan123SDKConfig) {
    this.config = {
      baseURL: "https://open-api.123pan.com",
      debug: false,
      ...config,
    };

    this.tokenManager = new TokenManager(
      this.config.clientId,
      this.config.clientSecret,
      this.config.baseURL,
      this.config.debug
    );

    this.httpClient = new HttpClient(
      this.config.baseURL,
      this.tokenManager,
      this.config.debug
    );
  }

  /**
   * 获取文件列表
   * @param parentFileId 父文件夹 ID，根目录为 0
   * @param limit 每页数量，最大 100
   * @param lastFileId 翻页标识
   */
  async getFileList(
    parentFileId: number = 0,
    limit: number = 100,
    lastFileId?: number
  ): Promise<ApiResponse<FileListResponse>> {
    const params: any = { parentFileId, limit };
    if (lastFileId !== undefined) {
      params.lastFileId = lastFileId;
    }

    const response = await this.httpClient.get<FileListResponse>(
      "/api/v2/file/list",
      { params }
    );

    if (this.config.debug) {
      console.log("[Pan123SDK] getFileList 响应:", response);
    }

    return response;
  }

  /**
   * 搜索文件
   * @param searchData 搜索关键字
   * @param searchMode 搜索模式：0-模糊搜索，1-精准搜索
   * @param limit 每页数量
   */
  async searchFiles(
    searchData: string,
    searchMode: 0 | 1 = 0,
    limit: number = 100
  ): Promise<ApiResponse<FileListResponse>> {
    const response = await this.httpClient.get<FileListResponse>(
      "/api/v2/file/list",
      { params: { parentFileId: 0, limit, searchData, searchMode } }
    );

    if (this.config.debug) {
      console.log("[Pan123SDK] searchFiles 响应:", response);
    }

    return response;
  }

  /**
   * 创建文件夹
   * @param folderName 文件夹名称
   * @param parentId 父文件夹 ID
   */
  async createFolder(
    folderName: string,
    parentID: number = 0
  ): Promise<ApiResponse<{ fileID: number }>> {
    const response = await this.httpClient.post<{ fileID: number }>(
      "/upload/v1/file/mkdir",
      { name: folderName, parentID }
    );

    if (this.config.debug) {
      console.log("[Pan123SDK] createFolder 响应:", response);
    }

    return response;
  }

  /**
   * 删除文件到回收站
   * @param fileIds 文件 ID 数组，最多 100 个
   */
  async trashFiles(fileIds: number[]): Promise<ApiResponse<null>> {
    if (fileIds.length > 100) {
      throw new Error("单次最多删除 100 个文件");
    }

    const response = await this.httpClient.post<null>("/api/v1/file/trash", {
      fileIDs: fileIds,
    });

    if (this.config.debug) {
      console.log("[Pan123SDK] trashFiles 响应:", response);
    }

    return response;
  }

  /**
   * 彻底删除文件（仅限回收站文件）
   * @param fileIds 文件 ID 数组，最多 100 个
   */
  async deleteFiles(fileIds: number[]): Promise<ApiResponse<null>> {
    if (fileIds.length > 100) {
      throw new Error("单次最多删除 100 个文件");
    }

    const response = await this.httpClient.post<null>("/api/v1/file/delete", {
      fileIDs: fileIds,
    });

    if (this.config.debug) {
      console.log("[Pan123SDK] deleteFiles 响应:", response);
    }

    return response;
  }

  /**
   * 重命名文件
   * @param fileId 文件 ID
   * @param newName 新文件名
   */
  async renameFile(
    fileId: number,
    newName: string
  ): Promise<ApiResponse<null>> {
    const response = await this.httpClient.put<null>("/api/v1/file/name", {
      fileId,
      fileName: newName,
    });

    if (this.config.debug) {
      console.log("[Pan123SDK] renameFile 响应:", response);
    }

    return response;
  }

  /**
   * 计算文件 MD5
   */
  private calculateMD5(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("md5");
      const stream = fs.createReadStream(filePath);

      stream.on("data", (data: string | Buffer) => {
        hash.update(data);
      });
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });
  }

  /**
   * 上传文件（自动处理分片上传）
   * @param filePath 本地文件路径
   * @param parentFileId 父文件夹 ID
   * @param filename 文件名（可选，默认使用本地文件名）
   */
  async uploadFile(
    filePath: string,
    parentFileId: number = 0,
    filename?: string,
    duplicate?:number,
  ): Promise<ApiResponse<UploadResult>> {
    // 获取文件信息
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;
    const fileName = filename || filePath.split(/[/\\]/).pop()!;

    // 计算文件 MD5
    if (this.config.debug) {
      console.log("[Pan123SDK] 正在计算文件 MD5...");
    }
    const etag = await this.calculateMD5(filePath);

    // 创建文件
    const createResponse = await this.httpClient.post<CreateFileResponse>(
      "/upload/v2/file/create",
      {
        parentFileID: parentFileId,
        filename: fileName,
        etag,
        size: fileSize,
        duplicate,
      }
    );

    if (this.config.debug) {
      console.log("[Pan123SDK] uploadFile - 创建文件响应:", createResponse);
    }

    // 如果创建文件失败，直接返回错误响应
    if (createResponse.code !== 0) {
      return createResponse as ApiResponse<UploadResult>;
    }

    // 秒传成功
    if (createResponse.data.reuse) {
      if (this.config.debug) {
        console.log("[Pan123SDK] 文件秒传成功");
      }
      return createResponse as ApiResponse<UploadResult>;
    }

    // 分片上传
    const { preuploadID, sliceSize, servers } = createResponse.data;
    if (!preuploadID || !sliceSize || !servers || servers.length === 0) {
      // 返回一个错误响应
      return {
        code: -1,
        message: "创建文件响应数据不完整",
        data: createResponse.data,
      } as ApiResponse<UploadResult>;
    }

    const uploadSlicesResult = await this.uploadSlices(
      filePath,
      preuploadID,
      sliceSize,
      servers[0]
    );

    // 如果分片上传失败，返回错误响应
    if (!uploadSlicesResult.success) {
      return {
        code: -1,
        message: uploadSlicesResult.error || "分片上传失败",
        data: null as any,
      } as ApiResponse<UploadResult>;
    }

    // 上传完毕
    const completeResponse = await this.completeUpload(preuploadID);

    if (this.config.debug) {
      console.log("[Pan123SDK] uploadFile - 上传完毕响应:", completeResponse);
    }

    return completeResponse;
  }

  /**
   * 上传分片
   */
  private async uploadSlices(
    filePath: string,
    preuploadID: string,
    sliceSize: number,
    uploadServer: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const fileSize = fs.statSync(filePath).size;
      const totalSlices = Math.ceil(fileSize / sliceSize);

      if (this.config.debug) {
        console.log(`[Pan123SDK] 开始分片上传，共 ${totalSlices} 个分片`);
      }

      const uploadClient = this.httpClient.createUploadClient(uploadServer);

      for (let sliceNo = 1; sliceNo <= totalSlices; sliceNo++) {
        const start = (sliceNo - 1) * sliceSize;
        const end = Math.min(start + sliceSize, fileSize);
        const sliceBuffer = Buffer.alloc(end - start);

        // 读取分片数据
        let fd: number | undefined;
        try {
          fd = fs.openSync(filePath, "r");
          fs.readSync(fd, sliceBuffer, 0, sliceBuffer.length, start);
        } catch (error: any) {
          return {
            success: false,
            error: `读取文件分片 ${sliceNo} 失败: ${error.message}`,
          };
        } finally {
          if (fd !== undefined) {
            try {
              fs.closeSync(fd);
            } catch (error) {
              // 忽略关闭文件时的错误
            }
          }
        }

        // 计算分片 MD5
        const sliceMD5 = crypto
          .createHash("md5")
          .update(sliceBuffer)
          .digest("hex");

        // 上传分片
        const FormData = await import("form-data");
        const formData = new FormData.default();
        formData.append("preuploadID", preuploadID);
        formData.append("sliceNo", sliceNo.toString());
        formData.append("sliceMD5", sliceMD5);
        formData.append("slice", sliceBuffer, { filename: "slice" });

        const response = await uploadClient.post(
          "/upload/v2/file/slice",
          formData,
          {
            headers: formData.getHeaders(),
          }
        );

        if (response.data.code !== 0) {
          return {
            success: false,
            error: `上传分片 ${sliceNo} 失败: ${response.data.message}`,
          };
        }

        if (this.config.debug) {
          console.log(`[Pan123SDK] 分片 ${sliceNo}/${totalSlices} 上传成功`);
        }
      }

      return { success: true };
    } catch (error: any) {
      // 捕获文件系统错误（如文件不存在）
      return {
        success: false,
        error: `分片上传失败: ${error.message}`,
      };
    }
  }

  /**
   * 完成上传
   */
  private async completeUpload(
    preuploadID: string
  ): Promise<ApiResponse<UploadCompleteResponse>> {
    let retries = 0;
    const maxRetries = 30;

    while (retries < maxRetries) {
      const response = await this.httpClient.post<UploadCompleteResponse>(
        "/upload/v2/file/upload_complete",
        { preuploadID }
      );

      // 直接返回响应，无论成功或失败
      if (response.code !== 0) {
        return response;
      }

      // 如果上传已完成，返回响应
      if (response.data.completed) {
        if (this.config.debug) {
          console.log("[Pan123SDK] 文件上传完成");
        }
        return response;
      }

      // 等待 1 秒后重试
      await new Promise((resolve) => setTimeout(resolve, 1000));
      retries++;
    }

    // 轮询超时，返回错误响应
    return {
      code: -1,
      message: "上传完毕轮询超时",
      data: {} as UploadCompleteResponse,
    };
  }
}

/**
 * 检查响应是否成功
 * @param response API 响应对象
 * @returns 当 code 等于 0 时返回 true，否则返回 false
 */
export function isSuccess<T>(response: ApiResponse<T>): boolean {
  return response.code === 0;
}

/**
 * 提取响应数据（仅在成功时）
 * @param response API 响应对象
 * @returns 成功时返回数据，失败时返回 null
 */
export function extractData<T>(response: ApiResponse<T>): T | null {
  return isSuccess(response) ? response.data : null;
}

export default Pan123SDK;
export * from "./types";
