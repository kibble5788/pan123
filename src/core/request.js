import { API_BASE_URL, COMMON_HEADERS } from "./constants.js";
import axios from "axios";

export default class Request {
  constructor(config = {}) {
    this.baseURL = config.baseURL || API_BASE_URL;
    this.accessToken = config.accessToken;
  }

  async request(options) {
    const {
      baseURL,
      url,
      method = "GET",
      data,
      params,
      headers: customHeaders = {},
      useCustomUrl = false,
      skipAuth = false,
    } = options;

    const headers = {
      ...COMMON_HEADERS,
      ...(!skipAuth && this.accessToken
        ? {
            Authorization: `Bearer ${this.accessToken}`,
          }
        : {}),
      ...customHeaders,
    };

    // 使用自定义URL或基础URL
    const effectiveBaseURL = useCustomUrl ? "" : baseURL || this.baseURL;

    // 构建请求URL
    const requestUrl = useCustomUrl ? url : `${effectiveBaseURL}${url}`;

    try {
      // 检查是否为二进制数据
      const isFormDataOrBuffer =
        data instanceof FormData ||
        data instanceof Buffer ||
        data instanceof ArrayBuffer ||
        data instanceof Blob ||
        (data && data.buffer instanceof ArrayBuffer);

      // 创建axios配置
      const axiosConfig = {
        url: requestUrl,
        method,
        headers,
        params,
        data: data,
      };
      if (!isFormDataOrBuffer) {
        axiosConfig.responseType = "json";
      }

      if (requestUrl.includes("123624.com")) {
      }

      const response = await axios(axiosConfig);

      // 对于二进制响应，直接返回
      if (
        response.headers["content-type"]?.includes("application/octet-stream")
      ) {
        return {
          data: response.data,
          status: response.status,
          ok: response.status >= 200 && response.status < 300,
        };
      }

      return response.data;
    } catch (error) {
      console.error("error", error.message);
    }
  }
}
