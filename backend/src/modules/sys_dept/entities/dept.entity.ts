import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class DeptEntity {
  @ApiProperty({ description: '部门ID', type: String })
  id: string

  @ApiProperty({ description: '部门名称', type: String })
  name: string

  @ApiPropertyOptional({ description: '部门描述', nullable: true, type: String })
  description?: string | null

  @ApiProperty({ description: '是否禁用', type: Boolean })
  disabled: boolean

  @ApiPropertyOptional({ description: '父部门ID', nullable: true, type: String })
  parentId?: string | null

  @ApiPropertyOptional({ description: '创建人ID', nullable: true, type: String })
  createdById?: string | null

  @ApiProperty({ description: '创建时间', type: String, format: 'date-time' })
  createdAt: Date

  @ApiProperty({ description: '更新时间', type: String, format: 'date-time' })
  updatedAt: Date
}

export class DeptTreeEntity extends DeptEntity {
  @ApiPropertyOptional({ description: '子部门列表', type: [DeptEntity] })
  children?: DeptEntity[]
}

export class DeptDetailEntity extends DeptEntity {
  @ApiPropertyOptional({ description: '父部门', type: DeptEntity })
  parent?: DeptEntity | null

  @ApiPropertyOptional({ description: '子部门列表', type: [DeptEntity] })
  children?: DeptEntity[]
}

