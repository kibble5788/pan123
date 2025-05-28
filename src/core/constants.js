export const API_BASE_URL = "https://open-api.123pan.com";
export const API_BASE_URL_WEB = "https://www.123pan.com";

export const API_ENDPOINTS = {
  ACCESS_TOKEN: "/api/v1/access_token",
  /** 获取文件列表（推荐） */
  FILE_LIST: "/api/v2/file/list",
  /** 打开解压文件 */
  UNCOMPRESS: "/b/api/restful/goapi/v1/archive/file/list",
  /** 获取文件状态 */
  UNCOMPRESS_STATUS: "/b/api/restful/goapi/v1/archive/file/status",
  /** 解压的文件复制到目标文件夹 */
  UNCOMPRESS_DOWNLOAD: "/b/api/restful/goapi/v1/archive/file/uncompress",
  /**
   * 创建文件
   * 开发者上传单文件大小限制10GB
   */
  FILE_CREATE: "/upload/v1/file/create",
  /** 获取上传地址&上传分片
   * 多个分片需要循环此步骤自增sliceNo+1，获取对应分片的上传地址，然后PUT上传分片
   */
  PRESIGNED_URL: "/upload/v1/file/get_upload_url",
  /**
   * 列举已上传分片（非必需）
   * 说明：该接口用于最后一片分片上传完成时，列出云端分片供用户自行比对。
   * 比对正确后调用上传完毕接口。
   * 当文件大小小于 sliceSize 分片大小时，无需调用该接口，该结果将返回空值。
   */
  CHUNKS_LIST: "/upload/v1/file/list_upload_parts",
  /** 上传完毕 文件上传完成后请求,建议：调用该接口前,请优先列举已上传的分片,在本地进行 md5 比对。 */
  UPLOAD_COMPLETE: "/upload/v1/file/upload_complete",
  /** 异步轮询获取上传结果 */
  UPLOAD_RESULT: "/upload/v1/file/upload_async_result",
  /** 获取文件下载链接 */
  FILE_DOWNLOAD_URL: "/api/v1/file/download_info",
  /**
   * 获取单个文件详情
   */
  FILE_DETAIL: "/api/v1/file/detail",
  /** 单个文件重命名 */
  FILE_RENAME: "/api/v1/file/rename",
  /** 删除文件至回收站 */
  FILE_DELETE: "/api/v1/file/trash",
};

export const COMMON_HEADERS = {
  "Content-Type": "application/json",
  Platform: "open_platform",
};
