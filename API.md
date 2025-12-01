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
  clientSecret: "你的clientSecret",
  debug:false
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


 
