import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type { TokenManager } from './token-manager';
import type { ApiResponse } from './types';

/**
 * HTTP 客户端 - 封装所有 API 请求
 */
export class HttpClient {
  private client: AxiosInstance;
  private tokenManager: TokenManager;
  private debug: boolean;

  constructor(baseURL: string, tokenManager: TokenManager, debug: boolean) {
    this.tokenManager = tokenManager;
    this.debug = debug;

    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'open_platform'
      }
    });

    // 请求拦截器：自动添加令牌
    this.client.interceptors.request.use(async (config: any) => {
      const token = await this.tokenManager.getToken();
      config.headers.Authorization = `Bearer ${token}`;
      
      if (this.debug) {
        console.log(`[Pan123SDK] ${config.method?.toUpperCase()} ${config.url}`);
      }
      
      return config;
    });

    // 响应拦截器：捕获 x-traceID 并传递到响应体
    this.client.interceptors.response.use(
      (response: any) => {
        // 将 x-traceID 从响应头添加到响应体
        if (response.headers['x-traceid']) {
          response.data['x-traceID'] = response.headers['x-traceid'];
        }
        return response;
      },
      (error: any) => {
        // 仅处理网络层错误，不基于 code 字段抛出异常
        if (this.debug) {
          console.error('[Pan123SDK] 网络请求失败:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET 请求
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * POST 请求
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * PUT 请求
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  /**
   * DELETE 请求
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * 创建新的客户端实例（用于上传域名）
   */
  createUploadClient(uploadURL: string): AxiosInstance {
    const uploadClient = axios.create({
      baseURL: uploadURL,
      headers: {
        'Platform': 'open_platform'
      }
    });

    // 为上传客户端添加令牌
    uploadClient.interceptors.request.use(async (config: any) => {
      const token = await this.tokenManager.getToken();
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    return uploadClient;
  }
}
