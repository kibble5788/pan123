# Pan123 SDK 接口文档

本 SDK 提供文件管理、上传、下载、离线下载及直链管理等功能。
---

## 目录

1. 快速开始
2. SDK 顶层方法（Pan123SDK）
3. FileService 方法（更底层的文件相关操作）
4. 上传流程（分片上传示例）
5. 常见类型与返回结构

---

## 1. 快速开始

创建 SDK 实例并初始化 token：

```javascript
import Pan123SDK from 'pan123';

const pan123 = new Pan123SDK({
  clientId: "你的clientId",
  clientSecret: "你的clientSecret",
  debug:false
});
---

## 2. SDK 方法（Pan123SDK）

这些是 SDK 对外暴露的常用 API（会自动处理令牌）：

- initToken(): Promise<string>
  - 返回 access token（会缓存）。

- uploadFile(filePath: string, options?: UploadOptions): Promise<UploadResult>
  - 完整的文件上传流程（计算 MD5、createFile -> 分片上传 -> complete -> 可轮询结果）。
  - options: { parentFileID?: number, containDir?: boolean, duplicate?: number }

- zipFile(params: ZipFileParams): Promise<CommonResult<any>>
  - 服务端解压并指定目标文件夹（会轮询任务状态）。

- getFileList(params?: FileListParams): Promise<CommonResult<{ fileList: FileInfo[]; hasMore: boolean; lastFileId?: number }>>
  - 获取文件/文件夹列表。params 支持：parentFileId, limit, searchData, searchMode, lastFileId。

- getFileDetail(fileID: number): Promise<CommonResult<FileInfo>>
  - 获取单个文件详情。

- getFileDownloadUrl(fileId: number): Promise<CommonResult<{ downloadUrl: string; expiresAt: string }>>
  - 获取文件下载直链（带过期时间）。

- resetFileName(params: RenameFileParams): Promise<CommonResult<FileInfo>>
  - SDK 层的文件重命名（PUT 请求，参数 { fileId, fileName }）。

- trashFile(params: DeleteFileParams): Promise<CommonResult<{ deletedCount: number; failedFiles: number[] }>>
  - 删除（回收）文件，参数 { fileIDs: string[] }。

- enableDirectLink(fileID: number) / disableDirectLink(fileID: number) / getFileDirectLink(fileID: number)
  - 管理并获取文件直链。

- createFolder(folderName: string, parentID?: number): Promise<CommonResult<FileInfo>>
  - 创建文件夹，默认 parentID = 0。

- createOfflineDownload(params: OfflineDownloadParams): Promise<CommonResult<OfflineDownloadResponse>>
  - 创建离线下载任务，params: { url, fileName?, dirID?, callBackUrl? }，返回 taskID。

示例：获取文件列表

```javascript
const list = await pan123.getFileList({ parentFileId: 0, limit: 100 });
console.log(list.data.fileList);
```



---

## 3. 上传流程（完整示例）

SDK 的 uploadFile(filePath, options) 封装了完整流程（计算 MD5 -> createFile -> 分片上传 -> 合并 -> 轮询）:

```javascript
await pan123.uploadFile('/tmp/hello.txt', { parentFileID: 0, containDir: false, duplicate: 1 });
```

返回格式（UploadResult）一般为：

{
  success: true | false,
  data: any | null,
  message: string,
  error?: any
}

---

 

 
