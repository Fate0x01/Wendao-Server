// 用户信息缓存
export enum RedisKey {
  UserInfoPrefix = 'auth:user:',
  RefreshTokenPrefix = 'auth:refresh:',
}

export const getUserInfoKey = (id) => `${RedisKey.UserInfoPrefix}${id}`
export const getRefreshTokenKey = (id) => `${RedisKey.RefreshTokenPrefix}${id}`
