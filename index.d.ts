/**
 * Pan123 SDK TypeScript 类型声明文件
 * @version 2.0.0
 */

// 核心配置接口
export interface Pan123Config {
  /** 客户端ID */
  clientId: string;
  /** 客户端密钥 */
  clientSecret: string;
  /** 基础URL（可选） */
  baseURL?: string;
  /** 访问令牌（可选） */
  accessToken?: string;
  /** 代理配置（可选） */
  proxy?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
  };
}

// 令牌缓存接口
export interface TokenCache {
  /** 访问令牌 */
  accessToken: string;
  /** 过期时间 */
  expiresIn: string;
  /** 令牌获取时间 */
  tokenTime: number;
}

// 通用响应接口
export interface CommonResult<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data: T | null;
  /** 响应消息 */
  message: string;
  /** 错误信息（可选） */
  error?: any;
}

// 文件信息接口
export interface FileInfo {
  /** 文件ID */
  fileId: number;
  /** 文件名 */
  fileName: string;
  /** 文件大小 */
  fileSize: number;
  /** 文件类型 (0: 文件, 1: 文件夹) */
  fileType: number;
  /** 父文件夹ID */
  parentFileId: number;
  /** 创建时间 */
  createTime: string;
  /** 修改时间 */
  updateTime: string;
  /** 文件MD5 */
  etag?: string;
  /** 文件扩展名 */
  fileExtension?: string;
  /** 缩略图URL */
  thumbnailUrl?: string;
  /** 是否为收藏 */
  isFavorite?: boolean;
}

// 上传选项接口
export interface UploadOptions {
  /** 父目录ID，默认为0（根目录） */
  parentFileID?: number;
  /** 重名策略 (1: 保留两者, 2: 覆盖) */
  duplicate?: number;
  /** 是否包含路径 */
  containDir?: boolean;
  /** 进度回调函数 */
  onProgress?: (progress: {
    loaded: number;
    total: number;
    percentage: number;
    currentChunk: number;
    totalChunks: number;
  }) => void;
}

// 上传结果接口
export interface UploadResult {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data: any;
  /** 响应消息 */
  message: string;
  /** 错误信息（可选） */
  error?: any;
}

// 文件列表查询参数
export interface FileListParams {
  /** 父文件夹ID，默认为0（根目录） */
  parentFileId?: number;
  /** 每页数量，最大100 */
  limit?: number;
  /** 搜索关键字 */
  searchData?: string;
  /** 搜索模式 (0: 模糊, 1: 精准) */
  searchMode?: number;
  /** 翻页查询ID */
  lastFileId?: number;
}

// 压缩文件参数
export interface ZipFileParams {
  /** 文件ID */
  fileId: number;
  /** 目标文件夹ID */
  folderId: number;
}

// 直链参数
export interface DirectLinkParams {
  /** 文件ID */
  fileID: number;
}

// 重命名参数
export interface RenameFileParams {
  /** 文件ID */
  fileId: number;
  /** 新文件名 */
  fileName: string;
}

// 删除参数
export interface DeleteFileParams {
  /** 文件ID数组 */
  fileIDs: number[];
}

// 支持的文件类型
export type SupportedFileType = File | Blob | Buffer | Uint8Array | ArrayBuffer;

// 分片类型
export type ChunkType = Blob | Buffer | Uint8Array;

// HTTP方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// 文件类型枚举
export enum FileType {
  FILE = 0,
  FOLDER = 1,
}

// 搜索模式枚举
export enum SearchMode {
  FUZZY = 0,
  EXACT = 1,
}

// 重名策略枚举
export enum DuplicateStrategy {
  KEEP_BOTH = 1,
  OVERWRITE = 2,
}

// 主要的SDK类
export default class Pan123SDK {
  constructor(config: Pan123Config);

  /**
   * 初始化访问令牌
   */
  initToken(): Promise<string>;

  /**
   * 上传文件
   * @param filePath 文件路径
   * @param options 上传选项
   */
  uploadFile(filePath: string, options?: UploadOptions): Promise<UploadResult>;

  /**
   * 解压文件
   * @param params 解压参数
   */
  zipFile(params: ZipFileParams): Promise<CommonResult<any>>;

  /**
   * 获取文件列表
   * @param params 查询参数
   */
  getFileList(params?: FileListParams): Promise<CommonResult<{
    fileList: FileInfo[];
    hasMore: boolean;
    lastFileId?: number;
  }>>;

  /**
   * 获取文件详情
   * @param fileID 文件ID
   */
  getFileDetail(fileID: number): Promise<CommonResult<FileInfo>>;

  /**
   * 获取文件下载链接
   * @param fileId 文件ID
   */
  getFileDownloadUrl(fileId: number): Promise<CommonResult<{
    downloadUrl: string;
    expiresAt: string;
  }>>;

  /**
   * 重命名文件
   * @param params 重命名参数
   */
  resetFileName(params: RenameFileParams): Promise<CommonResult<FileInfo>>;

  /**
   * 删除文件
   * @param params 删除参数
   */
  trashFile(params: DeleteFileParams): Promise<CommonResult<{
    deletedCount: number;
    failedFiles: number[];
  }>>;

  /**
   * 启用直链
   * @param fileID 文件ID
   */
  enableDirectLink(fileID: number): Promise<CommonResult<any>>;

  /**
   * 禁用直链
   * @param fileID 文件ID
   */
  disableDirectLink(fileID: number): Promise<CommonResult<any>>;

  /**
   * 获取直链
   * @param fileID 文件ID
   */
  getFileDirectLink(fileID: number): Promise<CommonResult<{
    directLink: string;
    expiresAt: string;
  }>>;

  /**
   * 创建文件夹
   * @param folderName 文件夹名称
   * @param parentID 父文件夹ID
   */
  createFolder(folderName: string, parentID?: number): Promise<CommonResult<FileInfo>>;

  /**
   * 获取当前配置
   */
  getConfig(): Pan123Config;

  /**
   * 获取令牌缓存
   */
  getTokenCache(): TokenCache;

  /**
   * 设置访问令牌
   * @param token 访问令牌
   */
  setAccessToken(token: string): void;
}