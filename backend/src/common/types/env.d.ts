declare namespace NodeJS {
  interface ProcessEnv {
    // PM2 实例 ID（如基于 PM2 集群部署，则由 PM2 自动提供）
    NODE_APP_INSTANCE: string
    // 端口
    PORT: number
    // 数据库连接字符串
    DATABASE_URL: string
    // 环境
    NODE_ENV: 'development' | 'production'
    // 全局路由前缀
    API_PREFIX: string
    // 是否开启 swagger
    SWAGGER_ENABLE: 'true' | 'false'
    // swagger 标题
    SWAGGER_TITLE: string
    // swagger 描述
    SWAGGER_DESCRIPTION: string
    // swagger 版本
    SWAGGER_VERSION: string
    // 是否开启跨域
    CORS_ENABLE: 'true' | 'false'
    // 跨域配置
    CORS_ORIGIN: string
    // 是否开启空值参数过滤
    NULL_INTERCEPTOR_ENABLE: 'true' | 'false'
    // 是否开启请求参数左右空白处理
    TRIM_STRING_INTERCEPTOR_ENABLE: 'true' | 'false'
    // JWT密钥
    JWT_SECRET: string
    // Redis配置
    REDIS_ENABLE: 'true' | 'false'
    REDIS_HOST: string
    REDIS_PORT: number
    REDIS_PASSWORD: string
    REDIS_DB: number
  }
}
