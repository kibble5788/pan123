# 获取 access_token 接口说明
## 一、接口信息
- **请求方式**：POST
- **接口地址**：`域名 + /api/v1/access_token`（域名：https://open-api.123pan.com）
- **注意事项**：此接口有访问频率限制，请获取到 access_token 后本地保存使用，并在 access_token 过期前及时重新获取。access_token 有效期根据返回的 expiredAt 字段判断。

## 二、请求参数
### 1. Header 参数
| 名称 | 类型 | 是否必填 | 说明 |
| ---- | ---- | ---- | ---- |
| Platform | string | 是 | 固定值：open_platform |

### 2. Body 参数
| 名称 | 类型 | 是否必填 | 说明 |
| ---- | ---- | ---- | ---- |
| clientID | string | 是 | 客户端 ID |
| clientSecret | string | 是 | 客户端密钥 |

## 三、返回数据
| 名称 | 类型 | 是否必填 | 说明 |
| ---- | ---- | ---- | ---- |
| accessToken | string | 是 | 访问凭证 |
| expiredAt | string | 是 | access_token 过期时间 |

## 四、示例
### 1. 请求示例
（需结合实际 clientID、clientSecret 构建请求，请求头需包含 Platform: open_platform，Content-Type: application/json）
```json
// 请求 Body 示例
{
  "clientID": "your_client_id",
  "clientSecret": "your_client_secret"
}
```

### 2. 响应示例
（具体响应格式参考开放平台统一响应规范，包含 code、message、data 字段，以下为 data 字段示例）
```json
// 响应 data 示例
{
  "accessToken": "your_access_token",
  "expiredAt": "2024-xx-xx xx:xx:xx"
}
```

> 文档来源：123云盘 06-17 09:37