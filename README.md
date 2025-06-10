# 123 网盘 SDK 使用文档（Node.js）

一个功能完整的 123 网盘 JavaScript SDK，支持文件上传、下载、管理等核心功能。

## 背景

123 网盘官方 API 上传文件流程较为复杂，需要调很多接口：创建文件，获取上传地址&上传分片，列举已上传分片，上传完毕，异步轮询获取上传结果。所以需要一个使用简单的工具包，本仓库在完成基础的文件上传功能后，又对接了官方其他接口，有些官方未实现接口调用的是 web api ,如`在线解压`接口

## ✨ 主要特性

- 🚀 **完整的文件操作**: 支持文件上传、下载、列表获取等
- 📦 **智能分片上传**: 自动处理大文件分片上传
- 🔄 **秒传检测**: 支持文件 MD5 校验和秒传功能
- 📁 **文件管理**: 支持文件夹操作和文件解压
- 🔐 **安全认证**: 基于 clientId 和 clientSecret 的安全认证
- 🌐 **多环境支持**: 支持 CommonJS 和 ES Module 两种导入方式
- ⚡ **异步处理**: 全异步 API 设计，支持 Promise 和 async/await

## 已实现功能

- 上传文件
- 创建文件夹  （2025-06-10） v1.0.8
- 获取文件夹内容
- 获取文件详情 （2025-05-29）
- 获取文件下载链接
- 在线解压文件
- 获取直链链接 ,启用直链,禁用直链 （2025-06-02） v1.0.7

## 📦 安装

### CDN 安装

```
https://cdn.jsdelivr.net/npm/@ked3/pan123-sdk@1.0.7/dist/pan123-sdk.cjs
```

### NPM 安装

```bash
npm install @ked3/pan123-sdk
```



## 🚀 快速开始

```javascript
import Pan123SDK from "@ked3/pan123-sdk";

const sdk = new Pan123SDK({
  clientId: "your_client_id",
  clientSecret: "your_client_secret",
});
//初始化token,SDK 会自动管理 token 的缓存和刷新。
await sdk.initToken();

//上传文件
const result = await sdk.uploadFile("./example.zip", {
  parentFileID: 0, // 父目录ID，0表示根目录
  containDir: false, // 是否包含目录结构
  duplicate: 1, // 重名处理策略：1-重命名，2-覆盖，3-跳过
});
//获取文件夹内容
const result = await sdk.getFileList({
  parentFileId: 0, // 父目录ID
  limit: 100, // 每页数量
  searchData: "", // 搜索关键词
  searchMode: 0, // 搜索模式
  lastFileId: 0, // 分页标识
});

//获取文件下载链接
const result = await sdk.getFileDownloadUrl({
  fileId: "123456789",
});

//解压文件
const result = await sdk.zipFile({
  fileId: "123456789", // ZIP文件ID
  folderId: "987654321", // 解压目标文件夹ID
});
```

## Commond JS 使用方式

```
const Pan123SDK = require("@ked3/pan123-sdk");
const sdk = new Pan123SDK({
  clientId: "xxx",
  clientSecret: "xxx",
});
async function main(){
  await sdk.initToken();
  const uploadResult = await sdk.uploadFile(filePath, {
    parentFileID: 14439872, // 父目录ID，0表示根目录
    containDir: false, // 是否包含目录结构
    duplicate: 2, // 重名处理策略：1-重命名，2-覆盖，3-跳过
  });
}
main()
```

## 本地开发

### 开发环境编译

```
pnpm run build
```

### npm 包发布流程

```
npm login
npm publish
```

请注意，如果包名带有组织 scope，如：@ked3，第一次发布，需要添加参数

```
npm publish --access public
```

## 📋 注意事项

1. **认证信息安全**: 请妥善保管 clientId 和 clientSecret，不要在客户端代码中暴露
2. **文件大小限制**: 大文件会自动进行分片上传，请确保网络稳定
3. **并发限制**: 建议控制并发上传数量，避免触发 API 限制
4. **错误重试**: SDK 内部已实现基础的错误重试机制
5. **Token 管理**: SDK 会自动管理 token 的缓存和刷新，无需手动处理

## 🔗 相关链接

- [123 网盘官方文档](https://www.123pan.com/developer)

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

如果这个 SDK 对您有帮助，请给我们一个 ⭐ 星标！
