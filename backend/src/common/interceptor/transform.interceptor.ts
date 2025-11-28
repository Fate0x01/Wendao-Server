/*
 * 因为 Prisma 的查询结果，日期和Decimal比较特殊，需要转换处理
 * 通过全局过滤可以减少工作量，更自然的进行开发
 * !拦截器需要注册为全局拦截器!
 */

import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from "@nestjs/common"
import { Decimal } from "@prisma/client/runtime/library"
import dayjs from "dayjs"
import { Observable } from "rxjs"
import { map } from "rxjs/operators"

@Injectable()
export class GlobalDateTransformInterceptor implements NestInterceptor {
	// 定义日期格式化模板
	private readonly dateFormat = "YYYY-MM-DD HH:mm:ss"

	/**
	 * 拦截器
	 * @param context 上下文
	 * @param next 下一个拦截器
	 * @returns
	 */
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		return next.handle().pipe(
			map((data) => {
				try {
					return this.transformDates(data)
				} catch (error) {
					console.error("数据转换异常:", error)
					return data // 转换失败时返回原始数据
				}
			}),
		)
	}

	/**
	 * 转换日期
	 * @param data 数据
	 * @returns 转换后的数据
	 */
	private transformDates(data: any): any {
		// 基础类型判断
		if (data === null || data === undefined) {
			return data
		}

		try {
			// 日期对象转换
			if (data instanceof Date) {
				const formattedDate = dayjs(data).format(this.dateFormat)
				// 验证转换后的日期格式是否有效
				return dayjs(formattedDate, this.dateFormat).isValid()
					? formattedDate
					: data
			}

			// Decimal对象转换
			if (data instanceof Decimal) {
				const number = data.toNumber()
				// 检查转换后的数值是否有效
				return Number.isFinite(number) ? number : data.toString()
			}

			// 数组递归处理
			if (Array.isArray(data)) {
				return data.map((item) => this.transformDates(item))
			}

			// 对象递归处理
			if (typeof data === "object") {
				const transformed: Record<string, any> = {}
				for (const [key, value] of Object.entries(data)) {
					if (Object.prototype.hasOwnProperty.call(data, key)) {
						transformed[key] = this.transformDates(value)
					}
				}
				return transformed
			}

			return data
		} catch (error) {
			console.error("数据转换过程异常:", error)
			return data // 转换失败时返回原始数据
		}
	}
}
