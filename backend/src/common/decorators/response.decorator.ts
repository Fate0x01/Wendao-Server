import { applyDecorators, Type } from '@nestjs/common'
import { ApiExtraModels, ApiOkResponse, ApiProperty, getSchemaPath } from '@nestjs/swagger'

const baseTypeNames = ['String', 'Number', 'Boolean']

export const SUCCESS_CODE = 0

/**
 * 响应结构
 * ok 成功
 * fail 失败
 */
export class ResultData {
  constructor(code = SUCCESS_CODE, msg?: string, data?: any) {
    this.code = code
    this.msg = msg ?? '操作成功'
    this.data = data === undefined ? null : data
  }

  @ApiProperty({ type: 'number', default: SUCCESS_CODE })
  code: number

  @ApiProperty({ type: 'string', default: '操作成功' })
  msg?: string

  data?: any

  total?: number

  static ok(data: any, msg?: string): ResultData {
    return new ResultData(SUCCESS_CODE, msg, data)
  }

  static list(list?: any, total?: number, msg?: string): ResultData {
    let res = new ResultData(SUCCESS_CODE)
    res.data = { list }
    if (total) {
      res.data.total = total
    }
    if (msg) {
      res.msg = msg
    }
    return res
  }

  static fail(code: number, msg?: string, data?: any): ResultData {
    return new ResultData(code || 500, msg || 'fail', data)
  }
}

/**
 * 封装 swagger 返回统一结构
 * 支持复杂类型 {  code, msg, data }
 * @param model 返回的 data 的数据类型
 * @param isArray data 是否是数组
 * @param isPager 设置为 true, 则 data 类型为 { list, total } ,  false data 类型是纯数组
 */
export const ApiResult = <TModel extends Type<any>>(model?: TModel, isArray?: boolean, isPager?: boolean) => {
  let items = null
  const modelIsBaseType = model && baseTypeNames.includes(model.name)
  if (modelIsBaseType) {
    items = { type: model.name.toLocaleLowerCase() }
  } else {
    items = { $ref: getSchemaPath(model) }
  }
  let prop = null
  if (isArray && isPager) {
    prop = {
      type: 'object',
      properties: {
        list: {
          type: 'array',
          items,
        },
        total: {
          type: 'number',
          default: 0,
        },
      },
    }
  } else if (isArray) {
    prop = {
      type: 'array',
      items,
    }
  } else if (model) {
    prop = items
  } else {
    prop = { type: 'null', default: null }
  }

  return applyDecorators(
    ApiExtraModels(...(model && !modelIsBaseType ? [ResultData, model] : [ResultData])),
    ApiOkResponse({
      schema: {
        allOf: [{ $ref: getSchemaPath(ResultData) }, { properties: { data: prop } }],
      },
    }),
  )
}
