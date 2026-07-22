// import React, { useState, useEffect } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Select,
  Row,
  Col
} from 'antd';

const FormAluguel = () => {
  return (
    <Form layout="vertical">
      <Row gutter={8}>
        <Col span={4}>
          <Form.Item label="Locatário">
            <Select>
              <Select.Option value="locatario1">Locatario1</Select.Option>
              <Select.Option value="locatario2">Locatario2</Select.Option>
              <Select.Option value="locatario2">Locatario3</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item label="Imóvel">
            <Select>
              <Select.Option value="locatario1">Gilberto Ferraz</Select.Option>
              <Select.Option value="locatario2">Montenegro</Select.Option>
              <Select.Option value="locatario2">Getulio Vargas</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={8}>
        <Col span={4}>
          <Form.Item label="Valor do aluguel">
            <Input />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item label="Data de início do contrato">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Button type="primary" htmlType="submit">Efetivar</Button>

    </Form>
  );
};

export default FormAluguel;