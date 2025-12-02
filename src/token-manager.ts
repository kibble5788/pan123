import axios, { AxiosInstance } from 'axios';
import type { TokenInfo, ApiResponse } from './types';

/**
 * 令牌管理器 - 负责令牌的获取、缓存和自动刷新
 */
export class TokenManager {
  private clientId: string;
  private clientSecret: string;
  private baseURL: string;
  private debug: boolean;
  private tokenInfo: TokenInfo | null = null;
  private refreshPromise: Promise<string> | null = null;
  private httpClient: AxiosInstance;

  constructor(clientId: string, clientSecret: string, baseURL: string, debug: boolean) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseURL = baseURL;
    this.debug = debug;
    
    this.httpClient = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Platform': 'open_platform'
      }
    });
  }

  /**
   * 获取有效的访问令牌（自动处理过期和刷新）
   */
  async getToken(): Promise<string> {
    // 如果正在刷新，等待刷新完成
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // 检查是否需要刷新令牌
    if (this.shouldRefreshToken()) {
      this.refreshPromise = this.refreshToken();
      try {
        const token = await this.refreshPromise;
        return token;
      } finally {
        this.refreshPromise = null;
      }
    }

    return this.tokenInfo!.accessToken;
  }

  /**
   * 判断是否需要刷新令牌
   */
  private shouldRefreshToken(): boolean {
    if (!this.tokenInfo) {
      return true;
    }

    const expiredAt = new Date(this.tokenInfo.expiredAt).getTime();
    const now = Date.now();
    // 提前 5 分钟刷新令牌
    const refreshThreshold = 5 * 60 * 1000;

    return expiredAt - now < refreshThreshold;
  }

  /**
   * 刷新令牌
   */
  private async refreshToken(): Promise<string> {
    try {
      if (this.debug) {
        console.log('[Pan123SDK] 正在获取访问令牌...');
      }

      const response = await this.httpClient.post<ApiResponse<TokenInfo>>(
        '/api/v1/access_token',
        {
          clientID: this.clientId,
          clientSecret: this.clientSecret
        }
      );

      if (response.data.code !== 0) {
        throw new Error(`获取令牌失败: ${response.data.message}`);
      }

      this.tokenInfo = response.data.data;

      if (this.debug) {
        console.log('[Pan123SDK] 令牌获取成功，过期时间:', this.tokenInfo!.expiredAt);
      }

      return this.tokenInfo!.accessToken;
    } catch (error: any) {
      if (this.debug) {
        console.error('[Pan123SDK] 获取令牌失败:', error.message);
      }
      throw new Error(`获取访问令牌失败: ${error.message}`);
    }
  }

  /**
   * 清除缓存的令牌
   */
  clearToken(): void {
    this.tokenInfo = null;
    this.refreshPromise = null;
  }
}
