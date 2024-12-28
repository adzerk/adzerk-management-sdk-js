import 'jest';
import { OpenAPIV3 } from 'openapi-types';
import validate, { ComplexValidationResult } from 'strickland-esm';
import factory from './string';

test('string validation succeeds if nullable enum and given null', () => {
  let schema: OpenAPIV3.SchemaObject = {
    type: 'string',
    nullable: true,
    enum: ['a', 'b', 'c'],
  };

  let validator = factory(schema, '');
  let result = validate(validator, undefined);

  expect((result as ComplexValidationResult).isValid).toStrictEqual(true);
});

test('string validation succeeds if nullable enum and value is in enum', () => {
  let schema: OpenAPIV3.SchemaObject = {
    type: 'string',
    nullable: true,
    enum: ['a', 'b', 'c'],
  };

  let validator = factory(schema, '');
  let result = validate(validator, 'b');

  expect((result as ComplexValidationResult).isValid).toStrictEqual(true);
});

test('string validation fails if nullable enum and value is not in enum', () => {
  let schema: OpenAPIV3.SchemaObject = {
    type: 'string',
    nullable: true,
    enum: ['a', 'b', 'c'],
  };

  let validator = factory(schema, '');
  let result = validate(validator, 'd');

  expect((result as ComplexValidationResult).isValid).toStrictEqual(false);
});

test('string validation fails if date string is too long', () => {
  let schema: OpenAPIV3.SchemaObject = {
    type: 'string',
    format: 'date',
    nullable: true,
  };

  let validator = factory(schema, '');
  let result = validate(validator, '2021-09-01T');

  expect((result as ComplexValidationResult).isValid).toStrictEqual(false);
});

test('string validation passes if date string is a date', () => {
  let schema: OpenAPIV3.SchemaObject = {
    type: 'string',
    format: 'date',
    nullable: true,
  };

  let validator = factory(schema, '');
  let result = validate(validator, '2021-09-01');

  expect((result as ComplexValidationResult).isValid).toStrictEqual(true);
});
