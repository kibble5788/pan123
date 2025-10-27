# 123网盘 SDK v2

基于 TypeScript 重构的 123网盘 API SDK，提供完整的文件管理功能。

## ✨ 特性

- 🚀 **TypeScript 重构** - 提供完整类型支持和智能提示
- 📦 **模块化设计** - 清晰的代码结构，易于维护和扩展
- 🔧 **双格式支持** - 同时支持 ESM 和 CommonJS
- 🛡️ **完善错误处理** - 统一的错误处理机制
- 📝 **详细文档** - 完整的 API 文档和使用示例
- ⚡ **高性能** - 优化的文件上传和下载流程
- 🔐 **安全可靠** - 内置令牌管理和自动刷新

## 📦 安装

```bash
npm install @ked3/pan123-sdk-v2
```

## 🚀 快速开始

### 基础配置

```typescript
import Pan123SDK from '@ked3/pan123-sdk-v2';

const sdk = new Pan123SDK({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  baseURL: 'https://open-api.123pan.com' // 可选，默认值
});
```

### 环境变量配置

创建 `config.env` 文件：

```env
PAN123_CLIENT_ID=your-client-id
PAN123_CLIENT_SECRET=your-client-secret
PAN123_BASE_URL=https://open-api.123pan.com
```

### 基本使用

```typescript
// 初始化访问令牌
const token = await sdk.initToken();
console.log('访问令牌:', token);

// 获取根目录文件列表
const fileList = await sdk.getFileList({ parentFileId: 0 });
console.log('文件列表:', fileList.data.fileList);

// 上传文件
const uploadResult = await sdk.uploadFile('./test.zip', {
  parentFileID: 0,
  duplicate: 1 // 1-保留两者，2-覆盖
});
console.log('上传结果:', uploadResult);

// 创建文件夹
const folder = await sdk.createFolder('新文件夹', 0);
console.log('文件夹创建:', folder);
```

## 📚 主要功能

### 文件管理
- ✅ 文件上传（支持秒传）
- ✅ 文件列表获取
- ✅ 文件详情查询
- ✅ 文件重命名
- ✅ 文件删除
- ✅ 文件夹创建

### 高级功能
- ✅ 文件压缩
- ✅ 直链管理
- ✅ 下载链接获取
- ✅ 批量操作支持

### 令牌管理
- ✅ 自动令牌获取
- ✅ 令牌缓存机制
- ✅ 令牌自动刷新

## 🔧 配置选项

```typescript
interface Pan123Config {
  clientId: string;        // 客户端ID（必需）
  clientSecret: string;    // 客户端密钥（必需）
  baseURL?: string;        // API基础URL（可选）
  accessToken?: string;    // 预设访问令牌（可选）
}
```

## 📖 API 文档

详细的 API 文档请参考 [API.md](./API.md)

## 🧪 测试

```bash
# 运行测试
npm test

# 或直接运行测试文件
node test/index.js
```

## 🏗️ 构建

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 清理构建文件
npm run clean
```

## 📁 项目结构

```
v2/
├── src/                 # 源代码
│   ├── core/           # 核心模块
│   ├── services/       # 服务模块
│   ├── types/          # 类型定义
│   └── index.ts        # 主入口
├── dist/               # 构建输出
├── test/               # 测试文件
├── rollup.config.js    # 构建配置
└── tsconfig.json       # TypeScript配置
```

## 🔄 从 v1 迁移

v2 版本在 API 设计上进行了优化，主要变化：

1. **更好的 TypeScript 支持**
2. **统一的错误处理**
3. **优化的方法签名**
4. **模块化的代码结构**

迁移示例：

```typescript
// v1
const result = await sdk.uploadFile({
  parentFileId: 0,
  filename: 'test.zip',
  filePath: './test.zip'
});

// v2
const result = await sdk.uploadFile('./test.zip', {
  parentFileID: 0,
  duplicate: 1
});
```

## 📋 注意事项

1. **认证信息安全**: 请妥善保管 clientId 和 clientSecret，不要在客户端代码中暴露
2. **文件大小限制**: 大文件会自动进行分片上传，请确保网络稳定
3. **并发限制**: 建议控制并发上传数量，避免触发 API 限制
4. **错误重试**: SDK 内部已实现基础的错误重试机制
5. **Token 管理**: SDK 会自动管理 token 的缓存和刷新，无需手动处理

## 🔗 相关链接

- [123 网盘官方文档](https://www.123pan.com/developer)
- [API 详细文档](./API.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

如果这个 SDK 对您有帮助，请给我们一个 ⭐ 星标！
