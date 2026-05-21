import crypto from 'crypto';

/**
 * 财联社 API 签名
 * 算法：参数按 key 排序拼接 → SHA-1 → MD5
 */
export function makeSign(params: Record<string, string>): string {
  const str = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  const sha1 = crypto.createHash('sha1').update(str).digest('hex');
  return crypto.createHash('md5').update(sha1).digest('hex');
}
