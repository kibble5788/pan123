/**
 * 123网盘SDK TypeScript类型定义
 */

/**
 * SDK配置接口
 */
export interface Pan123Config {
  /** 客户端ID */
  clientId: string;
  /** 客户端密钥 */
  clientSecret: string;
  /** 基础URL (可选) */
  baseURL?: string;
  /** 访问令牌 (可选) */
  accessToken?: string;
}

/**
 * 令牌缓存接口
 */
export interface TokenCache {
  /** 访问令牌 */
  accessToken: string;
  /** 过期时间 */
  expiresIn: number;
  /** 令牌获取时间 */
  tokenTime: number;
}

/**
 * API响应基础接口
 */
export interface ApiResponse<T = any> {
  /** 响应数据 */
  data: T;
  /** 状态码 */
  status: number;
  /** 是否成功 */
  ok: boolean;
}

/**
 * 通用响应结果接口
 */
export interface CommonResult<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 响应数据 */
  data: T | null;
  /** 响应消息 */
  message: string;
  /** 错误信息（可选） */
  error?: Error;
}

/**
 * 文件上传选项接口
 */
export interface UploadOptions {
  /** 父文件夹ID，默认为根目录 */
  parentFileID?: number;
  /** 是否包含目录结构 */
  containDir?: boolean;
  /** 重复文件处理方式：1-保留两者，2-覆盖 */
  duplicate?: number;
}

/**
 * 上传结果接口
 */
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

/**
 * 文件创建参数接口
 */
export interface CreateFileParams {
  /** 父目录ID */
  parentFileID: number;
  /** 文件名 */
  filename: string;
  /** 文件MD5 */
  etag: string;
  /** 文件大小(字节) */
  size: number;
  /** 重名策略 */
  duplicate?: number;
  /** 是否包含路径 */
  containDir?: boolean;
}

/**
 * 文件创建响应接口
 */
export interface CreateFileResponse {
  /** 是否秒传 */
  reuse: boolean;
  /** 预上传ID */
  preuploadID?: string;
  /** 分片大小 */
  sliceSize?: number;
  /** 文件信息 */
  fileInfo?: any;
}

/**
 * 获取文件列表参数接口
 */
export interface FileListParams {
  /** 父文件夹ID，默认为根目录 */
  parentFileId?: number;
  /** 返回结果数量限制 */
  limit?: number;
  /** 搜索关键词 */
  searchData?: string;
  /** 搜索模式 */
  searchMode?: number;
  /** 最后一个文件ID，用于分页 */
  lastFileId?: number;
}

/**
 * 文件信息接口
 */
export interface FileInfo {
  /** 文件ID */
  fileId: string;
  /** 文件名 */
  filename: string;
  /** 文件大小 */
  size: number;
  /** 文件类型 */
  type: number;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
  /** 父文件夹ID */
  parentFileId: string;
  /** 文件MD5 */
  etag?: string;
}

/**
 * 文件压缩参数接口
 */
export interface ZipFileParams {
  /** 要压缩的文件ID */
  fileId: string;
  /** 目标文件夹ID */
  folderId: string;
}

/**
 * 直链相关参数接口
 */
export interface DirectLinkParams {
  /** 文件ID */
  fileID: string;
}

/**
 * 文件重命名参数接口
 */
export interface RenameFileParams {
  /** 文件ID */
  fileId: string;
  /** 新文件名 */
  fileName: string;
}

/**
 * 文件删除参数接口
 */
export interface DeleteFileParams {
  /** 文件ID数组 */
  fileIDs: string[];
}

/**
 * 获取上传地址响应接口
 */
export interface UploadUrlResponse {
  /** 预签名上传URL */
  presignedURL: string;
}

/**
 * 上传完成响应接口
 */
export interface UploadCompleteResponse {
  /** 是否异步处理 */
  async: boolean;
  /** 是否完成 */
  completed?: boolean;
  /** 文件信息 */
  fileInfo?: FileInfo;
}

/**
 * 支持的文件类型
 */
export type SupportedFileType = File | Blob | Buffer | Uint8Array | ArrayBuffer;

/**
 * 分片类型
 */
export type ChunkType = Blob | Buffer | Uint8Array;

/**
 * HTTP方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * 请求选项接口
 */
export interface RequestOptions {
  /** 基础URL */
  baseURL?: string;
  /** 请求URL */
  url: string;
  /** HTTP方法 */
  method?: HttpMethod;
  /** 请求数据 */
  data?: any;
  /** 查询参数 */
  params?: Record<string, any>;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 是否使用自定义URL */
  useCustomUrl?: boolean;
  /** 是否跳过认证 */
  skipAuth?: boolean;
}

/**
 * 上传进度回调函数类型
 */
export type UploadProgressCallback = (progress: {
  loaded: number;
  total: number;
  percentage: number;
  currentChunk: number;
  totalChunks: number;
}) => void;

/**
 * 文件类型枚举
 */
export enum FileType {
  FILE = 0,
  FOLDER = 1,
}

/**
 * 搜索模式枚举
 */
export enum SearchMode {
  FUZZY = 0,
  EXACT = 1,
}

/**
 * 重名策略枚举
 */
export enum DuplicateStrategy {
  KEEP_BOTH = 1,
  OVERWRITE = 2,
}

/**
 * 文件状态枚举
 */
export enum FileStatus {
  NORMAL = 0,
  UPLOADING = 1,
  PROCESSING = 2,
  ERROR = 3,
}

/**
 * 扩展的文件信息接口
 */
export interface ExtendedFileInfo extends FileInfo {
  /** 文件路径 */
  path?: string;
  /** 文件深度 */
  depth?: number;
  /** 是否为根目录 */
  isRoot?: boolean;
  /** 子文件数量 */
  childCount?: number;
}

/**
 * 批量操作结果
 */
export interface BatchOperationResult<T = any> {
  /** 成功的项目 */
  success: T[];
  /** 失败的项目 */
  failed: Array<{
    item: T;
    error: string;
  }>;
  /** 总数 */
  total: number;
  /** 成功数 */
  successCount: number;
  /** 失败数 */
  failedCount: number;
}

/**
 * 分页查询结果
 */
export interface PaginatedResult<T> {
  /** 数据列表 */
  items: T[];
  /** 是否有更多数据 */
  hasMore: boolean;
  /** 下一页的游标 */
  nextCursor?: string | number;
  /** 总数（可选） */
  total?: number;
}

/**
 * 文件统计信息
 */
export interface FileStats {
  /** 总文件数 */
  totalFiles: number;
  /** 总文件夹数 */
  totalFolders: number;
  /** 总大小（字节） */
  totalSize: number;
  /** 最后更新时间 */
  lastModified: string;
}

/**
 * 上传配置
 */
export interface UploadConfig {
  /** 分片大小（字节） */
  chunkSize?: number;
  /** 并发上传数 */
  concurrency?: number;
  /** 重试次数 */
  retryCount?: number;
  /** 重试延迟（毫秒） */
  retryDelay?: number;
  /** 进度回调 */
  onProgress?: UploadProgressCallback;
}

/**
 * 下载配置
 */
export interface DownloadConfig {
  /** 下载路径 */
  savePath?: string;
  /** 是否覆盖已存在文件 */
  overwrite?: boolean;
  /** 进度回调 */
  onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
}

/**
 * SDK事件类型
 */
export enum SDKEventType {
  TOKEN_REFRESH = 'token_refresh',
  UPLOAD_START = 'upload_start',
  UPLOAD_PROGRESS = 'upload_progress',
  UPLOAD_COMPLETE = 'upload_complete',
  UPLOAD_ERROR = 'upload_error',
  DOWNLOAD_START = 'download_start',
  DOWNLOAD_PROGRESS = 'download_progress',
  DOWNLOAD_COMPLETE = 'download_complete',
  DOWNLOAD_ERROR = 'download_error',
}

/**
 * SDK事件数据
 */
export interface SDKEventData {
  [SDKEventType.TOKEN_REFRESH]: { token: string; expiresAt: string };
  [SDKEventType.UPLOAD_START]: { filePath: string; fileSize: number };
  [SDKEventType.UPLOAD_PROGRESS]: { filePath: string; progress: number; loaded: number; total: number };
  [SDKEventType.UPLOAD_COMPLETE]: { filePath: string; fileInfo: FileInfo };
  [SDKEventType.UPLOAD_ERROR]: { filePath: string; error: Error };
  [SDKEventType.DOWNLOAD_START]: { fileId: number; fileName: string };
  [SDKEventType.DOWNLOAD_PROGRESS]: { fileId: number; progress: number; loaded: number; total: number };
  [SDKEventType.DOWNLOAD_COMPLETE]: { fileId: number; savePath: string };
  [SDKEventType.DOWNLOAD_ERROR]: { fileId: number; error: Error };
}

/**
 * 事件监听器类型
 */
export type EventListener<T extends SDKEventType> = (data: SDKEventData[T]) => void;