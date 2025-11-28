import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from "@nestjs/common"
import { Observable } from "rxjs"

@Injectable()
export class TrimStringInterceptor implements NestInterceptor {
	private readonly valueHandlers = {
		string: (value: string) => value.trim(),
		array: (value: any[]) => value.map((item) => this.trimValue(item)),
		object: (value: Record<string, any>) =>
			Object.fromEntries(
				Object.entries(value).map(([key, val]) => [key, this.trimValue(val)]),
			),
	}

	private trimValue(value: any): any {
		if (value === null || value === undefined) return value
		const type = Array.isArray(value) ? "array" : typeof value
		const handler = this.valueHandlers[type]
		return handler ? handler(value) : value
	}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest()
		request.body = request.body ? this.trimValue(request.body) : request.body
		return next.handle()
	}
}
