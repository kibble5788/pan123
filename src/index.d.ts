/**
 * 123网盘SDK TypeScript声明文件
 * 提供123网盘API的完整类型定义
 */

/**
 * 123网盘SDK配置接口
 */
export interface Pan123Config {
  /** 客户端ID */
  clientId: string;
  /** 客户端密钥 */
  clientSecret: string;
}

/**
 * 文件上传选项接口
 */
export interface UploadOptions {
  /** 父文件夹ID，默认为根目录 */
  parentFileID?: number;
  /** 是否包含目录结构 */
  containDir?: boolean;
  /** 重复文件处理方式：0-跳过，1-覆盖，2-重命名 */
  duplicate?: number;
}

/**
 * 文件上传结果接口
 */
export interface UploadResult {
  /** 上传是否成功 */
  success: boolean;
  /** 返回的数据 */
  data: any;
  /** 返回消息 */
  message: string;
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
 * 文件压缩参数接口
 */
export interface ZipFileParams {
  /** 要压缩的文件ID */
  fileId: string;
  /** 目标文件夹ID */
  folderId: string;
}

/**
 * 123网盘SDK主类
 * 提供123网盘的完整API功能
 */
export default class Pan123SDK {
  /**
   * 构造函数
   * @param config SDK配置对象
   */
  constructor(config: Pan123Config);

  /**
   * 初始化访问令牌
   * @returns Promise<string> 返回访问令牌
   */
  initToken(): Promise<string>;

  /**
   * 上传文件到123网盘
   * @param filePath 本地文件路径
   * @param options 上传选项
   * @returns Promise<UploadResult> 上传结果
   */
  uploadFile(filePath: string, options?: UploadOptions): Promise<UploadResult>;

  /**
   * 压缩文件
   * @param params 压缩参数
   * @returns Promise<any> 压缩结果
   */
  zipFile(params: ZipFileParams): Promise<any>;

  /**
   * 获取文件列表
   * @param params 查询参数
   * @returns Promise<any> 文件列表数据
   */
  getFileList(params?: FileListParams): Promise<any>;

  /**
   * 获取文件详细信息
   * @param fileID 文件ID
   * @returns Promise<any> 文件详细信息
   */
  getFileDetail(fileID: string): Promise<any>;

  /**
   * 获取文件下载链接
   * @param params 包含文件ID的参数对象
   * @returns Promise<any> 下载链接信息
   */
  getFileDownloadUrl(params: { fileId: string }): Promise<any>;

  /**
   * 检查访问令牌是否有效
   * @returns boolean 令牌是否有效
   */
  isTokenValid(): boolean;
}
