# @ked3/pan123-sdk

123云盘开放平台 SDK，支持文件上传、下载、管理等功能。

## 特性

- ✅ 内置令牌管理和自动刷新（提前 5 分钟自动刷新）
- ✅ 支持 ESM 和 CommonJS
- ✅ 完整的 TypeScript 类型支持
- ✅ 自动处理分片上传
- ✅ 支持秒传
- ✅ 统一的响应结构（直接返回官方 API 响应）
- ✅ 灵活的错误处理（由调用者决定如何处理）
- ✅ 提供辅助函数简化响应处理

## 安装

```bash
npm install @ked3/pan123-sdk
```

## 快速开始

### CommonJS

```javascript
const Pan123SDK = require('@ked3/pan123-sdk');
const { isSuccess } = require('@ked3/pan123-sdk');

const sdk = new Pan123SDK({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  debug: true
});

// 不需要显式调用 initToken，首次调用会自动初始化并缓存令牌
const response = await sdk.createFolder('新文件夹', 0);
if (isSuccess(response)) {
  console.log('文件夹创建成功，ID:', response.data.fileID);
} else {
  console.error('创建失败:', response.message);
}
```

### ESM

```javascript
import Pan123SDK, { isSuccess } from '@ked3/pan123-sdk';

const sdk = new Pan123SDK({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  debug: true
});

const response = await sdk.getFileList(0, 20);
if (isSuccess(response)) {
  console.log('文件列表:', response.data.fileList);
} else {
  console.error('获取失败:', response.message);
}
```

## 响应结构

从 2.0 版本开始，所有 API 方法都返回统一的响应结构：

```typescript
interface ApiResponse<T> {
  code: number;           // 响应代码，0 表示成功
  message: string;        // 响应消息
  data: T;               // 响应数据
  'x-traceID'?: string;  // 追踪 ID（用于问题排查）
}
```

### 辅助函数

SDK 提供了两个辅助函数来简化响应处理：

```typescript
// 检查响应是否成功
isSuccess(response: ApiResponse<T>): boolean

// 提取响应数据（仅在成功时返回数据，失败时返回 null）
extractData(response: ApiResponse<T>): T | null
```

### 错误处理

SDK 将错误分为三类：

1. **输入验证错误**：在调用 API 前抛出异常（如文件 ID 超过 100 个）
2. **网络层错误**：网络连接失败时抛出异常
3. **API 业务错误**：通过响应的 `code` 字段返回（不抛出异常）

示例：

```javascript
try {
  const response = await sdk.getFileList(0, 20);
  
  // 检查业务错误
  if (response.code !== 0) {
    console.error('API 错误:', response.message);
    if (response['x-traceID']) {
      console.error('追踪 ID:', response['x-traceID']);
    }
    return;
  }
  
  // 使用数据
  console.log('文件列表:', response.data.fileList);
  
} catch (error) {
  // 处理输入验证错误或网络错误
  console.error('请求失败:', error.message);
}
```

## API 文档

### 初始化

```typescript
const sdk = new Pan123SDK({
  clientId: string;        // 必填：客户端 ID
  clientSecret: string;    // 必填：客户端密钥
  baseURL?: string;        // 可选：API 基础域名，默认 https://open-api.123pan.com
  debug?: boolean;         // 可选：是否开启调试模式，默认 false
});
```

### 文件列表

```typescript
// 获取文件列表
const response: ApiResponse<FileListResponse> = await sdk.getFileList(
  parentFileId: number,  // 父文件夹 ID，根目录为 0
  limit: number,         // 每页数量，最大 100
  lastFileId?: number    // 翻页标识（可选）
);

// 搜索文件
const response: ApiResponse<FileListResponse> = await sdk.searchFiles(
  searchData: string,    // 搜索关键字
  searchMode: 0 | 1,     // 0-模糊搜索，1-精准搜索
  limit: number          // 每页数量
);
```

使用示例：

```javascript
const response = await sdk.getFileList(0, 20);
if (isSuccess(response)) {
  const files = response.data.fileList;
  console.log(`共 ${files.length} 个文件`);
  files.forEach(file => {
    console.log(`- ${file.filename} (${file.size} 字节)`);
  });
} else {
  console.error('获取文件列表失败:', response.message);
}
```

### 文件夹管理

```typescript
// 创建文件夹
const response: ApiResponse<{ fileID: number }> = await sdk.createFolder(
  folderName: string,    // 文件夹名称
  parentFileId: number   // 父文件夹 ID，默认 0（根目录）
);
```

使用示例：

```javascript
const response = await sdk.createFolder('我的文件夹', 0);
if (isSuccess(response)) {
  console.log('文件夹创建成功，ID:', response.data.fileID);
} else {
  console.error('创建文件夹失败:', response.message);
}
```

### 文件上传

```typescript
// 上传文件（自动处理分片上传和秒传）
const response: ApiResponse<UploadResult> = await sdk.uploadFile(
  filePath: string,      // 本地文件路径
  parentFileId: number,  // 父文件夹 ID，默认 0
  filename?: string      // 文件名（可选，默认使用本地文件名）
);
```

使用示例：

```javascript
const response = await sdk.uploadFile('./video.mp4', 0, '我的视频.mp4');
if (isSuccess(response)) {
  const fileID = response.data.fileID;
  console.log('文件上传成功，ID:', fileID);
  
  // 检查是否秒传
  if (response.data.reuse) {
    console.log('文件已秒传');
  }
} else {
  console.error('上传失败:', response.message);
}
```

### 文件操作

```typescript
// 删除文件到回收站
const response: ApiResponse<null> = await sdk.trashFiles([fileId1, fileId2]);

// 彻底删除文件（仅限回收站文件）
const response: ApiResponse<null> = await sdk.deleteFiles([fileId1, fileId2]);

// 重命名文件
const response: ApiResponse<null> = await sdk.renameFile(fileId, '新文件名.txt');
```

使用示例：

```javascript
// 删除文件到回收站
const response = await sdk.trashFiles([123, 456]);
if (isSuccess(response)) {
  console.log('文件已移至回收站');
} else {
  console.error('删除失败:', response.message);
}

// 重命名文件
const response = await sdk.renameFile(123, '新名称.txt');
if (isSuccess(response)) {
  console.log('重命名成功');
} else {
  console.error('重命名失败:', response.message);
}
```

## 示例

### 完整上传流程

```javascript
const Pan123SDK = require('@ked3/pan123-sdk');
const { isSuccess, extractData } = require('@ked3/pan123-sdk');

async function main() {
  const sdk = new Pan123SDK({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    debug: true
  });

  try {
    // 创建文件夹
    const folderResponse = await sdk.createFolder('我的文件夹', 0);
    if (!isSuccess(folderResponse)) {
      console.error('创建文件夹失败:', folderResponse.message);
      return;
    }
    
    const folderId = folderResponse.data.fileID;
    console.log('文件夹创建成功，ID:', folderId);

    // 上传文件
    const uploadResponse = await sdk.uploadFile(
      './test.mp4',
      folderId,
      '测试视频.mp4'
    );
    
    if (!isSuccess(uploadResponse)) {
      console.error('文件上传失败:', uploadResponse.message);
      return;
    }
    
    console.log('文件上传成功，文件 ID:', uploadResponse.data.fileID);

    // 获取文件列表
    const listResponse = await sdk.getFileList(folderId, 20);
    if (isSuccess(listResponse)) {
      console.log('文件列表:', listResponse.data.fileList);
    } else {
      console.error('获取文件列表失败:', listResponse.message);
    }
  } catch (error) {
    // 处理输入验证错误或网络错误
    console.error('操作失败:', error.message);
  }
}

main();
```

### 使用 extractData 简化代码

```javascript
const Pan123SDK = require('@ked3/pan123-sdk');
const { isSuccess, extractData } = require('@ked3/pan123-sdk');

async function main() {
  const sdk = new Pan123SDK({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  });

  // 获取文件列表
  const response = await sdk.getFileList(0, 20);
  const data = extractData(response);
  
  if (data) {
    console.log(`共 ${data.fileList.length} 个文件`);
    data.fileList.forEach(file => {
      console.log(`- ${file.filename}`);
    });
  } else {
    console.error('获取失败:', response.message);
  }
}

main();
```

### 批量操作示例

```javascript
const Pan123SDK = require('@ked3/pan123-sdk');
const { isSuccess } = require('@ked3/pan123-sdk');

async function batchDelete(sdk, fileIds) {
  // 输入验证（超过 100 个会抛出异常）
  try {
    const response = await sdk.trashFiles(fileIds);
    
    if (isSuccess(response)) {
      console.log(`成功删除 ${fileIds.length} 个文件`);
      return true;
    } else {
      console.error('删除失败:', response.message);
      // 可以根据 code 进行特定处理
      if (response.code === 401) {
        console.error('认证失败，请检查凭证');
      }
      return false;
    }
  } catch (error) {
    console.error('输入验证失败:', error.message);
    return false;
  }
}
```

### 错误处理最佳实践

```javascript
const Pan123SDK = require('@ked3/pan123-sdk');
const { isSuccess } = require('@ked3/pan123-sdk');

async function robustUpload(sdk, filePath, parentId) {
  try {
    const response = await sdk.uploadFile(filePath, parentId);
    
    if (isSuccess(response)) {
      console.log('上传成功');
      return response.data.fileID;
    } else {
      // 记录详细错误信息
      console.error('上传失败');
      console.error('错误代码:', response.code);
      console.error('错误消息:', response.message);
      
      // 记录追踪 ID 用于问题排查
      if (response['x-traceID']) {
        console.error('追踪 ID:', response['x-traceID']);
      }
      
      return null;
    }
  } catch (error) {
    // 处理网络错误或输入验证错误
    console.error('请求异常:', error.message);
    return null;
  }
}
```

## 从 1.x 迁移到 2.0

2.0 版本引入了破坏性变更，所有方法现在返回完整的 `ApiResponse` 结构。

### 主要变更

1. **所有方法返回 ApiResponse**

```javascript
// 1.x
const fileList = await sdk.getFileList(0, 20);
console.log(fileList.fileList);

// 2.0
const response = await sdk.getFileList(0, 20);
if (isSuccess(response)) {
  console.log(response.data.fileList);
}
```

2. **错误不再抛出异常**

```javascript
// 1.x
try {
  const fileList = await sdk.getFileList(0, 20);
} catch (error) {
  console.error('API 错误:', error.message);
}

// 2.0
const response = await sdk.getFileList(0, 20);
if (response.code !== 0) {
  console.error('API 错误:', response.message);
}
```

3. **uploadFile 返回完整响应**

```javascript
// 1.x
const fileId = await sdk.uploadFile('./file.txt');
console.log('文件 ID:', fileId);

// 2.0
const response = await sdk.uploadFile('./file.txt');
if (isSuccess(response)) {
  console.log('文件 ID:', response.data.fileID);
}
```

### 迁移建议

使用 `isSuccess` 和 `extractData` 辅助函数可以简化迁移：

```javascript
import { isSuccess, extractData } from '@ked3/pan123-sdk';

const response = await sdk.getFileList(0, 20);
const data = extractData(response);
if (data) {
  // 使用数据
  console.log(data.fileList);
} else {
  // 处理错误
  console.error(response.message);
}
```

## 注意事项

1. **令牌管理**：SDK 会自动管理令牌，在令牌过期前 5 分钟自动刷新，无需手动处理
2. **并发限制**：同一 client_id 最多支持 3 个令牌同时使用
3. **文件大小**：单文件最大支持 10GB
4. **批量操作**：删除、重命名等批量操作单次最多 100 个文件
5. **频率限制**：请注意官方 API 的频率限制，避免请求过于频繁
6. **错误处理**：从 2.0 开始，API 业务错误通过响应的 `code` 字段返回，不再抛出异常
7. **追踪 ID**：遇到问题时，可以使用响应中的 `x-traceID` 字段进行问题排查

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## License

MIT
