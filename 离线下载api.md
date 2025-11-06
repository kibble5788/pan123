# 123云盘开放平台 - 离线下载API文档（创建任务接口）
## 一、接口基础信息
- 接口名称：创建离线下载任务
- 请求方式：POST
- 接口地址：域名 + /api/v1/offline/download
- 核心功能：通过http/https地址创建离线下载任务，文件自动存储至云盘指定目录

---

## 二、请求参数说明
### 2.1 Header参数
| 名称 | 类型 | 是否必填 | 说明 |
|------|------|----------|------|
| Authorization | string | 是 | 鉴权access_token，格式需携带Bearer前缀 |
| Platform | string | 是 | 固定值：open_platform |

### 2.2 Body参数（JSON格式）
| 名称 | 类型 | 是否必填 | 说明 |
|------|------|----------|------|
| url | string | 是 | 下载资源地址，仅支持http/https协议 |
| fileName | string | 否 | 自定义文件名称，需携带支持的图片格式（png、gif、jpeg、tiff、webp、jpg、tif、svg、bmp） |
| dirID | number | 否 | 指定下载目录ID（示例：10023），不支持根目录，默认存储至“来自:离线下载”目录 |
| callBackUrl | string | 否 | 回调地址，下载成功/失败时会推送通知，包含url、status、fileReason、fileID字段 |

---

## 三、返回数据说明
| 名称 | 类型 | 说明 |
|------|------|------|
| taskID | number | 离线下载任务ID，用于查询任务进度 |

---

## 四、调用示例
### 4.1 请求示例（Curl）
```curl
curl --location 'https://open-api.123pan.com/api/v1/offline/download' \
--header 'Content-Type: application/json' \
--header 'Platform: open_platform' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJl...(完整access_token)' \
--data '{
"url": "https://vip.123pan.cn/1815309870/...(完整下载地址)",
"fileName": "测试https离线下载.mp4"
}'
```

### 4.2 响应示例（JSON）
```json
{
"taskID": 123456
}
```

### 4.3 回调通知示例
```json
{
"url": "http://dc.com/resource.jpg",
"status": 0, // 0=成功，1=失败
"failReason": "", // 失败时返回具体原因，成功为空
"fileID": 100 // 成功后文件在云盘的唯一ID
}
```

---

## 五、注意事项
1. 仅支持http/https协议的下载地址，其他协议无法创建任务。
2. 自定义fileName时必须携带指定图片格式，非图片格式需忽略该参数。
3. 禁止调用非OpenAPI接口列表中的非公开接口，违规将被封号。
4. 若未指定dirID，文件默认存入“来自:离线下载”目录，不可直接下载至根目录。

---
