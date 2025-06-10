我来帮您生成这个项目的接口文档。首先我需要查看项目的源代码来了解具体的接口实现。

Read file: /D:/ext.hanshujiang1/Downloads/pan123-main (1)/pan123-main/src/index.js
让我继续查看其他相关文件以获取完整的接口信息。

Read file: /D:/ext.hanshujiang1/Downloads/pan123-main (1)/pan123-main/src/services/file.js
根据查看的源代码，我来为您编写一个完整的接口文档：

# Pan123 SDK 接口文档

## 目录
1. [初始化](#初始化)
2. [文件操作](#文件操作)
3. [文件夹操作](#文件夹操作)
4. [文件上传](#文件上传)
5. [文件下载](#文件下载)
6. [文件管理](#文件管理)

## 初始化

### 创建SDK实例
```javascript
const pan123 = new Pan123SDK({
  clientId: "你的clientId",
  clientSecret: "你的clientSecret"
});
```

## 文件操作

### 获取文件列表
```javascript
await pan123.getFileList({
  parentFileId: 0,        // 父文件夹ID，根目录为0
  limit: 100,            // 每页数量，最大100
  searchData: "",        // 搜索关键字（可选）
  searchMode: 0,         // 搜索模式：0-模糊，1-精准（可选）
  lastFileId: 0          // 翻页查询ID（可选）
});
```

### 获取文件详情
```javascript
await pan123.getFileDetail(fileID);
```

### 获取文件下载链接
```javascript
await pan123.getFileDownloadUrl({ fileId });
```

### 重命名文件
```javascript
await pan123.resetFileName({ 
  fileId, 
  fileName 
});
```

### 删除文件
```javascript
await pan123.trashFile({ 
  fileIDs: [] // 文件ID数组
});
```

## 文件夹操作

### 创建文件夹
```javascript
await pan123.createFolder(folderName, parentID);
```

## 文件上传

### 完整文件上传流程
```javascript
await pan123.uploadFile(filePath, {
  parentFileID: 0,       // 父目录ID
  containDir: false,     // 是否包含路径
  duplicate: 1          // 重名策略：1-保留两者，2-覆盖
});
```

### 文件解压
```javascript
await pan123.zipFile({
  fileId,    // 压缩文件ID
  folderId   // 目标文件夹ID
});
```

## 文件下载

### 获取直链
```javascript
// 启用直链
await pan123.enableDirectLink(fileID);

// 禁用直链
await pan123.disableDirectLink(fileID);

// 获取直链
await pan123.getFileDirectLink(fileID);
```

## 文件管理

### 文件上传流程说明
1. 创建文件
2. 获取上传地址
3. 上传文件分片
4. 文件比对（可选）
5. 上传完成
6. 轮询获取结果（如果需要）

### 文件分片上传
```javascript
// 1. 创建文件
await fileService.createFile({
  parentFileID: 0,
  filename: "文件名",
  etag: "文件MD5",
  size: 文件大小,
  duplicate: 1,
  containDir: false
});

// 2. 获取上传地址
await fileService.getUploadUrl(preuploadID, sliceNo);

// 3. 上传分片
await fileService.uploadChunk(presignedURL, chunk);

// 4. 列举已上传分片
await fileService.listUploadedChunks(preuploadID);

// 5. 上传完成
await fileService.completeUpload(preuploadID);

// 6. 轮询获取结果
await fileService.pollUploadResult(preuploadID);
```

 
