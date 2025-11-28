import React, { memo, useEffect, useRef, useState } from 'react';
import { Button, Col, DatePicker, DateRangePicker, Form, Input, Row, Select } from 'tdesign-react';
import type { FormInstanceFunctions, SubmitContext } from 'tdesign-react/es/form/type';
import type { CrudSearchFormProps, SearchFieldConfig } from '../types';

const { FormItem } = Form;

/**
 * CRUD 搜索表单组件
 * 配置化搜索表单，支持多种字段类型
 */
const CrudSearchForm: React.FC<CrudSearchFormProps> = ({ fields, onSearch, onReset, labelWidth = 80 }) => {
  const formRef = useRef<FormInstanceFunctions>(null);

  // 存储异步加载的选项
  const [asyncOptions, setAsyncOptions] = useState<Record<string, Array<{ label: string; value: unknown }>>>({});
  const [loadingFields, setLoadingFields] = useState<Record<string, boolean>>({});

  // 加载异步选项
  useEffect(() => {
    const loadAsyncOptions = async () => {
      const fieldsWithRequest = fields.filter((f) => f.type === 'select' && f.request);

      for (const field of fieldsWithRequest) {
        if (field.request) {
          setLoadingFields((prev) => ({ ...prev, [field.name]: true }));
          try {
            const options = await field.request();
            setAsyncOptions((prev) => ({ ...prev, [field.name]: options }));
          } catch (error) {
            console.error(`加载 ${field.name} 选项失败:`, error);
          } finally {
            setLoadingFields((prev) => ({ ...prev, [field.name]: false }));
          }
        }
      }
    };

    loadAsyncOptions();
  }, [fields]);

  // 提交处理
  const handleSubmit = (e: SubmitContext) => {
    if (e.validateResult === true) {
      const formValues = formRef.current?.getFieldsValue?.(true) as Record<string, unknown>;
      const searchParams: Record<string, unknown> = {};

      // 遍历字段配置，进行值转换
      fields.forEach((field) => {
        const value = formValues[field.name];
        if (value !== undefined && value !== null && value !== '') {
          if (field.transform) {
            const transformed = field.transform(value);
            if (transformed !== undefined) {
              Object.assign(
                searchParams,
                typeof transformed === 'object' ? transformed : { [field.name]: transformed },
              );
            }
          } else {
            searchParams[field.name] = value;
          }
        }
      });

      onSearch(searchParams);
    }
  };

  // 重置处理（表单重置由 TDesign Form 的 type='reset' 按钮自动处理）
  const handleReset = () => {
    onReset();
  };

  // 渲染字段
  const renderField = (field: SearchFieldConfig) => {
    const { type, name, placeholder, options } = field;

    switch (type) {
      case 'input':
        return <Input placeholder={placeholder || `请输入${field.label}`} />;

      case 'select': {
        const fieldOptions = field.request ? asyncOptions[name] || [] : options || [];
        return (
          <Select
            options={fieldOptions}
            placeholder={placeholder || `请选择${field.label}`}
            clearable
            loading={loadingFields[name]}
          />
        );
      }

      case 'date':
        return <DatePicker placeholder={placeholder || `请选择${field.label}`} clearable />;

      case 'dateRange':
        return <DateRangePicker placeholder={[`开始日期`, `结束日期`]} clearable />;

      default:
        return <Input placeholder={placeholder || `请输入${field.label}`} />;
    }
  };

  return (
    <Form ref={formRef} onSubmit={handleSubmit} onReset={handleReset} labelWidth={labelWidth} colon>
      <Row>
        <Col flex='1'>
          <Row gutter={[16, 16]}>
            {fields.map((field) => (
              <Col key={field.name} span={field.span || 3} xs={12} sm={6} xl={field.span || 3}>
                <FormItem label={field.label} name={field.name}>
                  {renderField(field)}
                </FormItem>
              </Col>
            ))}
          </Row>
        </Col>
        <Col flex='160px'>
          <Button theme='primary' type='submit' className='ml-4'>
            查询
          </Button>
          <Button type='reset' variant='base' theme='default' className='ml-2'>
            重置
          </Button>
        </Col>
      </Row>
    </Form>
  );
};

export default memo(CrudSearchForm);
