/**
 * SDK 配置选项
 */
export interface Pan123SDKConfig {
  /** 客户端 ID */
  clientId: string;
  /** 客户端密钥 */
  clientSecret: string;
  /** API 基础域名 */
  baseURL?: string;
  /** 是否开启调试模式 */
  debug?: boolean;
}

/**
 * 令牌信息
 */
export interface TokenInfo {
  /** 访问令牌 */
  accessToken: string;
  /** 过期时间 */
  expiredAt: string;
}

/**
 * API 响应基础结构
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  'x-traceID'?: string;
}

/**
 * 文件信息
 */
export interface FileInfo {
  fileId: number;
  filename: string;
  type: 0 | 1; // 0-文件，1-文件夹
  size: number;
  etag: string;
  status: number;
  parentFileId: number;
  category: 0 | 1 | 2 | 3; // 0-未知，1-音频，2-视频，3-图片
  trashed: 0 | 1; // 0-否，1-是
}

/**
 * 文件列表响应
 */
export interface FileListResponse {
  lastFileId: number;
  fileList: FileInfo[];
}

/**
 * 创建文件响应
 */
export interface CreateFileResponse {
  fileID?: number;
  preuploadID?: string;
  reuse: boolean;
  sliceSize?: number;
  servers?: string[];
}

/**
 * 上传完毕响应
 */
export interface UploadCompleteResponse {
  completed: boolean;
  fileID: number;
}

/**
 * 上传结果联合类型（秒传或分片上传完成）
 */
export type UploadResult = CreateFileResponse | UploadCompleteResponse;
