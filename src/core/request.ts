import { API_BASE_URL, COMMON_HEADERS } from './constants';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import type { 
  Pan123Config, 
  RequestOptions, 
  ApiResponse, 
  HttpMethod 
} from '@/types';

/**
 * HTTP请求类
 * 封装axios，提供统一的请求接口
 */
export default class Request {
  /** 基础URL */
  private baseURL: string;
  /** 访问令牌 */
  public accessToken: string | undefined;

  /**
   * 构造函数
   * @param config 配置对象
   */
  constructor(config: Partial<Pan123Config> = {}) {
    this.baseURL = config.baseURL || API_BASE_URL;
    this.accessToken = config.accessToken;
  }

  /**
   * 发送HTTP请求
   * @param options 请求选项
   * @returns 响应数据
   */
  async request<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
    const {
      baseURL,
      url,
      method = 'GET',
      data,
      params,
      headers: customHeaders = {},
      useCustomUrl = false,
      skipAuth = false,
    } = options;

    // 构建请求头
    const headers: Record<string, string> = {
      ...COMMON_HEADERS,
      ...(!skipAuth && this.accessToken
        ? {
            Authorization: `Bearer ${this.accessToken}`,
          }
        : {}),
      ...customHeaders,
    };

    // 使用自定义URL或基础URL
    const effectiveBaseURL = useCustomUrl ? '' : baseURL || this.baseURL;

    // 构建请求URL
    const requestUrl = useCustomUrl ? url : `${effectiveBaseURL}${url}`;

    try {
      // 检查是否为二进制数据
      const isFormDataOrBuffer = this.isBinaryData(data);

      // 创建axios配置
      const axiosConfig: AxiosRequestConfig = {
        url: requestUrl,
        method: method.toLowerCase() as any,
        headers,
        params: params || {},
        data,
      };

      if (!isFormDataOrBuffer) {
        axiosConfig.responseType = 'json';
      }

      const response: AxiosResponse<T> = await axios(axiosConfig);

      // 对于二进制响应，直接返回
      if (
        response.headers['content-type']?.includes('application/octet-stream')
      ) {
        return {
          data: response.data,
          status: response.status,
          ok: response.status >= 200 && response.status < 300,
        };
      }

      return response.data as ApiResponse<T>;
    } catch (error) {
      console.error('Request error:', error instanceof Error ? error.message : error);
      throw error;
    }
  }

  /**
   * 检查数据是否为二进制类型
   * @param data 要检查的数据
   * @returns 是否为二进制数据
   */
  private isBinaryData(data: any): boolean {
    return (
      (typeof FormData !== 'undefined' && data instanceof FormData) ||
      (typeof Buffer !== 'undefined' && data instanceof Buffer) ||
      (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) ||
      (typeof Blob !== 'undefined' && data instanceof Blob) ||
      (typeof ArrayBuffer !== 'undefined' &&
        data &&
        data.buffer instanceof ArrayBuffer)
    );
  }

  /**
   * GET请求
   * @param url 请求URL
   * @param params 查询参数
   * @param options 其他选项
   * @returns 响应数据
   */
  async get<T = any>(
    url: string,
    params?: Record<string, any>,
    options: Partial<RequestOptions> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      ...(params && { params }),
      ...options,
    });
  }

  /**
   * POST请求
   * @param url 请求URL
   * @param data 请求数据
   * @param options 其他选项
   * @returns 响应数据
   */
  async post<T = any>(
    url: string,
    data?: any,
    options: Partial<RequestOptions> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...options,
    });
  }

  /**
   * PUT请求
   * @param url 请求URL
   * @param data 请求数据
   * @param options 其他选项
   * @returns 响应数据
   */
  async put<T = any>(
    url: string,
    data?: any,
    options: Partial<RequestOptions> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...options,
    });
  }

  /**
   * DELETE请求
   * @param url 请求URL
   * @param options 其他选项
   * @returns 响应数据
   */
  async delete<T = any>(
    url: string,
    options: Partial<RequestOptions> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...options,
    });
  }

  /**
   * 设置访问令牌
   * @param token 访问令牌
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * 获取访问令牌
   * @returns 访问令牌
   */
  getAccessToken(): string | undefined {
    return this.accessToken;
  }

  /**
   * 设置基础URL
   * @param baseURL 基础URL
   */
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
  }

  /**
   * 获取基础URL
   * @returns 基础URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }
}