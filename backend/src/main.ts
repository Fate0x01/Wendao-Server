import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import express from 'express'
import { mw as requestIpMw } from 'request-ip'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/filters/all-exception-filter'
import { RemoveNullValuesInterceptor } from './common/interceptor/removenull.interceptor'
import { GlobalDateTransformInterceptor } from './common/interceptor/transform.interceptor'
import { TrimStringInterceptor } from './common/interceptor/trimstring.interceptor'
import { PermissionScanner } from './modules/sys_auth/permission.scanner'

async function setup(app: INestApplication) {
  // ===== 注册API文档 =====
  if (process.env.SWAGGER_ENABLE === 'true') {
    const options = new DocumentBuilder().setTitle(process.env.SWAGGER_TITLE).setDescription(process.env.SWAGGER_DESCRIPTION).setVersion(process.env.SWAGGER_VERSION).build()
    const document = SwaggerModule.createDocument(app, options)
    SwaggerModule.setup('docs', app, document)
  }
  // ===== 全局参数校验管道 =====
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 自动转换参数类型
      whitelist: true, // 过滤掉未定义的属性
    }),
  )
  // ===== 程序核心配置 =====
  // 设置全局路由前缀
  app.setGlobalPrefix(process.env.API_PREFIX)
  // 获取真实 ip
  app.use(requestIpMw({ attributeName: 'ip' }))
  // 增强解析
  app.use(express.json())
  // 增强解析
  app.use(express.urlencoded({ extended: true }))
  // 移除空值
  if (process.env.NULL_INTERCEPTOR_ENABLE === 'true') {
    app.useGlobalInterceptors(new RemoveNullValuesInterceptor())
  }
  // 全局字符串前后空白拦截处理
  if (process.env.TRIM_STRING_INTERCEPTOR_ENABLE === 'true') {
    app.useGlobalInterceptors(new TrimStringInterceptor())
  }
  // 设置跨域
  if (process.env.CORS_ENABLE === 'true') {
    app.enableCors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  }
  // 全局响应拦截处理
  app.useGlobalInterceptors(new GlobalDateTransformInterceptor())
  // 全局异常处理
  app.useGlobalFilters(new AllExceptionsFilter(app.get(ConfigService)))
  // 扫描权限入库
  app.get(PermissionScanner).scanAndSave()
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await setup(app)
  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
