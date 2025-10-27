import type { TokenCache } from '@/types';

/**
 * 生成参数密钥（模拟算法）
 * @param inputNumber 输入数字
 * @returns 生成的参数密钥字符串
 */
export function getParamKey(inputNumber: number): string {
  // 当前时间戳（以秒为单位）
  const timestamp = Math.floor(Date.now() / 1000);
  // 生成随机数部分
  const randomPart1 = Math.floor(Math.random() * 10000000);
  // 可能使用了某种哈希或加密算法
  const part3 = (inputNumber * 1582) ^ timestamp;
  // 组合生成最终字符串
  return `${timestamp}-${randomPart1}-${part3}`;
}

/**
 * 检查token是否有效
 * @param tokenCache 令牌缓存对象
 * @returns 是否有效
 */
export function isTokenValid(tokenCache: TokenCache): boolean {
  if (
    !tokenCache.accessToken ||
    !tokenCache.tokenTime ||
    !tokenCache.expiresIn
  ) {
    return false;
  }

  // 检查是否过期（提前5分钟刷新）
  const now = Date.now();
  const expiresAt = new Date(tokenCache.expiresIn).getTime() - 5 * 60 * 1000; // 提前5分钟
  return now < expiresAt;
}

/**
 * 延迟执行函数
 * @param ms 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 验证文件名是否合法
 * @param filename 文件名
 * @returns 是否合法
 */
export function isValidFilename(filename: string): boolean {
  if (!filename || filename.trim().length === 0) {
    return false;
  }
  
  // 检查非法字符
  const invalidChars = /[<>:"/\\|?*]/;
  return !invalidChars.test(filename);
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 文件扩展名（不包含点）
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }
  return filename.substring(lastDotIndex + 1).toLowerCase();
}