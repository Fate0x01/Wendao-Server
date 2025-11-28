/**
 * 睡眠函数
 * @param ms 睡眠时间（毫秒）
 * @returns Promise
 */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
