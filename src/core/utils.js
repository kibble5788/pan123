/** 生成参数 模拟  */
function getParamKey(inputNumber) {
  // 当前时间戳（以秒为单位）
  const timestamp = Math.floor(Date.now() / 1000);
  // 生成随机数部分
  const randomPart1 = Math.floor(Math.random() * 10000000);
  // 可能使用了某种哈希或加密算法
  const part3 = (inputNumber * 1582) ^ timestamp;
  // 组合生成最终字符串
  return `${timestamp}-${randomPart1}-${part3}`;
}

/** 检查token是否有效 */
function isTokenValid(tokenCache) {
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
export { getParamKey, isTokenValid };
