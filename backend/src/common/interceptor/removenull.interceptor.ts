import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'

@Injectable()
export class RemoveNullValuesInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    // 移除请求体中的 null 值
    if (request.body) {
      const cleaned = this.removeNull(request.body)
      Object.keys(request.body).forEach((key) => delete request.body[key])
      Object.assign(request.body, cleaned)
    }
    // 移除查询参数中的 null 值
    if (request.query) {
      const cleaned = this.removeNull(request.query)
      Object.keys(request.query).forEach((key) => delete request.query[key])
      Object.assign(request.query, cleaned)
    }
    return next.handle()
  }

  private removeNull(obj: any): any {
    return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== null))
  }
}
