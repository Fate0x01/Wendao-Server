import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Service Error'

    // 处理 HTTP 异常
    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      message = exceptionResponse['message'] ?? exception.message
      if (Array.isArray(message)) {
        message = message[0]
      }
    }

    // 处理运行时错误
    if (exception instanceof Error) {
      message = this.configService.get('NODE_ENV') === 'development' ? exception.message : '服务异常'
      console.error(exception)
    }

    // TODO: 记录运行时错误日志
    response.status(200).json({
      code: status,
      msg: message,
      data: null,
    })
  }
}
