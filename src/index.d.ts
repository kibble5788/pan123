export interface Pan123Config {
  clientId: string;
  clientSecret: string;
}

export interface UploadOptions {
  parentFileID?: number;
  containDir?: boolean;
  duplicate?: number;
}

export interface UploadResult {
  success: boolean;
  data: any;
  message: string;
}

export interface FileListParams {
  parentFileId?: number;
  limit?: number;
  searchData?: string;
  searchMode?: number;
  lastFileId?: number;
}

export interface ZipFileParams {
  fileId: string;
  folderId: string;
}

export default class Pan123SDK {
  constructor(config: Pan123Config);

  initToken(): Promise<string>;

  uploadFile(filePath: string, options?: UploadOptions): Promise<UploadResult>;

  zipFile(params: ZipFileParams): Promise<any>;

  getFileList(params?: FileListParams): Promise<any>;

  getFileDownloadUrl(params: { fileId: string }): Promise<any>;

  isTokenValid(): boolean;
}
