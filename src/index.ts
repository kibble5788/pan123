import { Request } from '@/core';
import { FileService } from '@/services';
import { API_ENDPOINTS, API_BASE_URL_WEB } from '@/core/constants';
import { getParamKey, isTokenValid, delay } from '@/core/utils';
import fs from 'fs';
import path from 'path';
import type {
  Pan123Config,
  TokenCache,
  UploadOptions,
  UploadResult,
  FileListParams,
  FileInfo,
  ZipFileParams,
  DirectLinkParams,
  RenameFileParams,
  DeleteFileParams,
  CommonResult,
  ApiResponse,
  OfflineDownloadParams,
  OfflineDownloadResponse
} from '@/types';

/**
 * Pan123 云存储 SDK
 * 提供文件上传、下载、管理等功能的TypeScript实现
 */
export default class Pan123SDK {
  /** SDK配置 */
  private config: Pan123Config;
  /** HTTP请求实例 */
  private request: Request;
  /** 令牌缓存 */
  private tokenCache: TokenCache;
  /** 文件服务实例 */
  public file: FileService;

  /**
   * 构造函数
   * @param config SDK配置
   */
  constructor(config: Pan123Config) {
    if (!config.clientId || !config.clientSecret) {
      throw new Error('clientId 和 clientSecret 是必须的');
    }

    this.config = config;
    this.request = new Request(config);

    // 初始化token缓存
    this.tokenCache = {
      accessToken: '',
      expiresIn: 0,
      tokenTime: 0,
    };

    // 初始化各个服务
    this.file = new FileService(this.request);
  }

  /**
   * 初始化访问令牌
   * @returns 访问令牌
   */
  async initToken(): Promise<string> {
    // 检查token是否过期
    if (isTokenValid(this.tokenCache)) {
      return this.tokenCache.accessToken;
    }

    try {
      const response = await this.request.request<{
        accessToken: string;
        expiredAt: string;
      }>({
        url: API_ENDPOINTS.ACCESS_TOKEN,
        method: 'POST',
        data: {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        },
      });
      if (this.config?.debug) {
        console.log('Token response:', response.data);
      }


      // 缓存token信息
      this.tokenCache = {
        accessToken: response.data.accessToken,
        // 使用毫秒时间戳缓存过期时间，便于有效性判断
        expiresIn: new Date(response.data.expiredAt).getTime(),
        tokenTime: Date.now(),
      };

      // 设置到request实例中
      this.request.setAccessToken(response.data.accessToken);
      return response.data.accessToken;
    } catch (error) {
      throw new Error(
        '获取access token失败，请检查clientId 和 clientSecret是否正确'
      );
    }
  }

  /**
   * 确保令牌已初始化并可用（懒加载）
   * - 如果令牌不存在或已过期，则调用 initToken
   * - 如果令牌存在但未设置到请求实例，进行同步
   */
  private async ensureToken(): Promise<void> {
    // 如果当前缓存令牌不可用，则初始化令牌
    if (!isTokenValid(this.tokenCache)) {
      await this.initToken();
      return;
    }
    // 若请求实例未持有令牌，则同步令牌
    const currentToken = this.request.getAccessToken?.() || (this as any).request.accessToken;
    if (!currentToken && this.tokenCache.accessToken) {
      this.request.setAccessToken(this.tokenCache.accessToken);
    }
  }

  /**
   * 完整的文件上传流程
   * @param filePath 文件本地路径
   * @param options 上传选项
   * @returns 上传结果
   */
  async uploadFile(filePath: string, options: UploadOptions = {}): Promise<UploadResult> {
    try {
      // 确保令牌已就绪
      await this.ensureToken();
      // 获取文件信息
      const fileStats = fs.statSync(filePath);
      const fileName = path.basename(filePath);
      const fileBuffer = fs.readFileSync(filePath);

      // 计算MD5

      if (this.config?.debug) {
        console.log('开始计算MD5');
      }
      const etag = await this.file.calculateFileMD5FromPath(filePath);
      if (this.config?.debug) {
        console.log('开始创建文件');
      }


      // 1. 创建文件
      const createResult = await this.file.createFile({
        parentFileID: options.parentFileID || 0,
        filename: options.containDir
          ? filePath.replace(/\\/g, '/').split('/').slice(-2).join('/') // 取最后两级路径作为相对路径
          : fileName,
        etag,
        size: fileStats.size,
        duplicate: options.duplicate || 1,
        containDir: options.containDir || false,
      });
      if (this.config?.debug) {
        console.log('判断是否秒传成功', createResult);
      }


      // 判断是否秒传成功
      if (createResult?.reuse === true) {
        return {
          success: true,
          data: createResult,
          message: '文件秒传成功',
        };
      }

      // 非秒传，继续上传流程
      const { preuploadID, sliceSize } = createResult;

      if (!preuploadID || !sliceSize) {
        return {
          success: false,
          data: createResult,
          message: '获取上传参数失败',
        };
      }

      // 文件分片
      const chunks = this.file.sliceFile(fileBuffer, sliceSize);
      const totalChunks = chunks.length;

      if (this.config?.debug) {
        console.log('分片数量:', totalChunks);
      }

      if (totalChunks === 0) {
        return {
          success: false,
          data: { filePath, sliceSize },
          message: '分片失败,分片数量=0',
        };
      }

      // 上传所有分片
      for (let i = 0; i < totalChunks; i++) {
        const sliceNo = i + 1; // 分片序号从1开始

        // 2. 获取上传地址
        const urlResult = await this.file.getUploadUrl(
          preuploadID,
          sliceNo
        );
        if (this.config?.debug) {
          console.log('获取上传地址', urlResult.presignedURL);
        }


        // 3. 上传分片
        await this.file.uploadChunk(urlResult.presignedURL, chunks[i]);
        await delay(1000);
      }

      // 4. 文件比对（非必需，但建议执行）
      if (fileStats.size > sliceSize) {
        const chunksResult = await this.file.listUploadedChunks(preuploadID);
        // 在这里可以比对本地与云端的分片MD5
      }

      // 5. 上传完成
      const completeResult = await this.file.completeUpload(
        preuploadID
      );

      if (this.config?.debug) {
        console.log('上传完成', completeResult);
      }
      // 判断是否需要异步轮询
      if (completeResult.async === true) {
        // 6. 轮询获取结果
        const finalResult = await this.file.pollUploadResult(preuploadID);

        return {
          success: true,
          data: finalResult,
          message: '文件上传成功',
        };
      } else {
        return {
          success: true,
          data: completeResult,
          message: '文件上传成功',
        };
      }
    } catch (error) {
      if (this.config?.debug) {
        console.log('Upload error:', error);
      }

      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : '上传失败',
        error,
      };
    }
  }

  /**
   * 解压文件
   * @param params 解压参数
   * @returns 解压结果
   */
  async zipFile(params: ZipFileParams): Promise<CommonResult<any>> {
    const { fileId, folderId } = params;
    const tk = new Date().valueOf();

    try {
      // 确保令牌已就绪
      await this.ensureToken();
      // 创建解压任务
      const res = await this.request.request({
        baseURL: API_BASE_URL_WEB,
        url: API_ENDPOINTS.UNCOMPRESS,
        method: 'GET',
        params: {
          fileId,
          password: '',
          [tk]: getParamKey(tk),
        },
      });

      // 轮询解压状态
      const taskId = res.data.taskId;
      let status = 0;
      let fileInfo: any = {};

      const getStatus = async (): Promise<void> => {
        const { data: statusInfo } = await this.request.request({
          baseURL: API_BASE_URL_WEB,
          url: API_ENDPOINTS.UNCOMPRESS_STATUS,
          method: 'GET',
          params: {
            fileId,
            taskId: taskId,
            taskType: 1,
            [tk]: getParamKey(tk),
          },
        });

        if (statusInfo.state === 2) {
          if (this.config?.debug) {
            console.log('解压成功');
          }
          status = 2;
          fileInfo = statusInfo;
        } else {
          if (this.config?.debug) {
            console.log('正在打开压缩包');
          }
          await delay(1000);
          await getStatus();
        }
      };

      await getStatus();

      // 解压到目标文件夹
      const res2 = await this.request.request({
        baseURL: API_BASE_URL_WEB,
        url: `${API_ENDPOINTS.UNCOMPRESS_DOWNLOAD}?${tk}=${getParamKey(tk)}`,
        method: 'POST',
        data: {
          fileId: fileId,
          list: fileInfo.list,
          password: '',
          targetFileId: folderId,
          taskId: taskId,
        },
      });

      if (this.config?.debug) {
        console.log('解压中', res2);
      }

      const getStatus2 = async (): Promise<void> => {
        const { data: statusInfo } = await this.request.request({
          baseURL: API_BASE_URL_WEB,
          url: API_ENDPOINTS.UNCOMPRESS_STATUS,
          method: 'GET',
          params: {
            fileId,
            taskId: taskId,
            taskType: 2,
            [tk]: getParamKey(tk),
          },
        });

        if (statusInfo.state === 2) {
          if (this.config?.debug) {
            console.log('解压成功2');
          }
        } else {
          if (this.config?.debug) {
            console.log('解压状态：', statusInfo.state);
          }
          await delay(1000);
          await getStatus2();
        }
      };

      await getStatus2();

      return {
        success: true,
        data: res2.data,
        message: '解压成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : '解压失败',
      };
    }
  }

  /**
   * 获取文件列表
   * @param params 查询参数
   * @returns 文件列表
   */
  async getFileList(params: FileListParams = {}): Promise<CommonResult<{
    fileList: FileInfo[];
    hasMore: boolean;
    lastFileId?: number;
  }>> {
    try {
      // 确保令牌已就绪
      await this.ensureToken();
      const {
        parentFileId = 0,
        limit = 100,
        searchData = '',
        searchMode = 0,
        lastFileId = 0,
      } = params;

      const res = await this.request.request({
        url: API_ENDPOINTS.FILE_LIST,
        method: 'GET',
        params: {
          parentFileId,
          limit,
          searchData,
          searchMode,
          lastFileId,
        },
      });

      return {
        success: true,
        data: res.data,
        message: '',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : '获取文件列表失败',
      };
    }
  }

  /**
   * 获取单个文件详情
   * @param fileID 文件ID
   * @returns 文件详情
   */
  async getFileDetail(fileID: number): Promise<CommonResult<FileInfo>> {
    try {
      // 确保令牌已就绪
      await this.ensureToken();
      const res = await this.request.request({
        url: API_ENDPOINTS.FILE_DETAIL,
        method: 'GET',
        params: { fileID },
      });

      return {
        success: true,
        data: res.data,
        message: '',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : '获取文件详情失败',
      };
    }
  }

  /**
   * 获取文件下载链接
   * @param fileId 文件ID
   * @returns 下载链接
   */
  async getFileDownloadUrl(fileId: number): Promise<CommonResult<{
    downloadUrl: string;
    expiresAt: string;
  }>> {
    try {
      // 确保令牌已就绪
      await this.ensureToken();
      const res = await this.request.request({
        url: API_ENDPOINTS.FILE_DOWNLOAD,
        method: 'GET',
        params: { fileId },
      });

      return {
        success: true,
        data: res.data,
        message: '',
      };
    } catch (error) {
      throw new Error(`获取文件下载链接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 重命名文件
   * @param params 重命名参数
   * @returns 重命名结果
   */
  async resetFileName(params: RenameFileParams): Promise<CommonResult<FileInfo>> {
    try {
      // 确保令牌已就绪
      await this.ensureToken();
      const { fileId, fileName } = params;
      const res = await this.request.request({
        url: API_ENDPOINTS.RENAME_FILE,
        method: 'PUT',
        data: { fileId, fileName },
      });

      return {
        success: true,
        data: res.data,
        message: '重命名成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : '重命名失败',
      };
    }
  }

  /**
   * 删除文件
   * @param params 删除参数
   * @returns 删除结果
   */
  async trashFile(params: DeleteFileParams): Promise<CommonResult<{
    deletedCount: number;
    failedFiles: number[];
  }>> {
    try {
      // 确保令牌已就绪
      await this.ensureToken();
      const { fileIDs } = params;
      const res = await this.request.request({
        url: API_ENDPOINTS.DELETE_FILE,
        method: 'POST',
        data: { fileIDs },
      });

      return {
        success: true,
        data: res.data,
        message: '删除成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : '删除失败',
      };
    }
  }

  /**
   * 启用直链
   * @param fileID 文件ID
   * @returns 启用结果
   */
  async enableDirectLink(fileID: number): Promise<CommonResult<any>> {
    try {
      // 确保令牌已就绪
      await this.ensureToken();
      const res = await this.request.request({
        url: API_ENDPOINTS.ENABLE_DIRECT_LINK,
        method: 'POST',
        data: { fileID },
      });

      return {
        success: true,
        data: res.data,
        message: '启用直链成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : '启用直链失败',
      };
    }
  }

  /**
   * 禁用直链
   * @param fileID 文件ID
   * @returns 禁用结果
   */
  async disableDirectLink(fileID: number): Promise<CommonResult<any>> {
    try {
      // 确保令牌已就绪
      await this.ensureToken();
      const res = await this.request.request({
        url: API_ENDPOINTS.DISABLE_DIRECT_LINK,
        method: 'POST',
        data: { fileID },
      });

      return {
        success: true,
        data: res.data,
        message: '禁用直链成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : '禁用直链失败',
      };
    }
  }

  /**
   * 获取直链链接
   * @param fileID 文件ID
   * @returns 直链信息
   */
  async getFileDirectLink(fileID: number): Promise<CommonResult<{
    directLink: string;
    expiresAt: string;
  }>> {
    try {
      // 确保令牌已就绪
      await this.ensureToken();
      const res = await this.request.request({
        url: API_ENDPOINTS.GET_DIRECT_LINK,
        method: 'GET',
        params: { fileID },
      });
  if (this.config?.debug) {
        console.log('获取直链结果：', res);
      }
      return {
        success: true,
        data: res.data,
        message: '获取直链成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : '获取直链失败',
      };
    }
  }

  /**
   * 创建文件夹
   * @param folderName 文件夹名称
   * @param parentID 父文件夹ID
   * @returns 创建结果
   */
  async createFolder(folderName: string, parentID: number = 0): Promise<CommonResult<FileInfo>> {
    try {
      // 确保令牌已就绪
      await this.ensureToken();
      const res = await this.request.request({
        url: API_ENDPOINTS.FOLDER_CREATE,
        method: 'POST',
        data: { name: folderName, parentID: parentID },
      });

      return {
        success: true,
        data: res.data,
        message: '创建文件夹成功',
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : '创建文件夹失败',
      };
    }
  }

  /**
   * 创建离线下载任务
   * @param params 离线下载参数（url、fileName、dirID、callBackUrl）
   * @returns 离线下载任务ID
   */
  async createOfflineDownload(
    params: OfflineDownloadParams
  ): Promise<CommonResult<OfflineDownloadResponse>> {
    try {
      // 确保令牌已就绪
      await this.ensureToken();
      // 委托给文件服务
      const result = await this.file.createOfflineDownload(params);
      return result;
    } catch (error) {
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : '创建离线下载任务失败',
      };
    }
  }

  /**
   * 获取当前配置
   * @returns 当前配置
   */
  getConfig(): Pan123Config {
    return { ...this.config };
  }

  /**
   * 获取当前令牌缓存
   * @returns 令牌缓存
   */
  getTokenCache(): TokenCache {
    return { ...this.tokenCache };
  }

  /**
   * 设置访问令牌
   * @param token 访问令牌
   */
  setAccessToken(token: string): void {
    this.tokenCache.accessToken = token;
    this.request.setAccessToken(token);
  }
}

// 导出类型定义
export type {
  Pan123Config,
  TokenCache,
  UploadOptions,
  UploadResult,
  FileListParams,
  FileInfo,
  ZipFileParams,
  DirectLinkParams,
  RenameFileParams,
  DeleteFileParams,
  CommonResult,
  ApiResponse,
  OfflineDownloadParams,
  OfflineDownloadResponse,
};
