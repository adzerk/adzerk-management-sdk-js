import 'jest';
import { OpenAPIV3 } from 'openapi-types';
import validate, { ComplexValidationResult } from 'strickland-esm';
import factory from './array';

test('array validation succeeds if nullable and given null', () => {
  let schema: OpenAPIV3.SchemaObject = {
    type: 'array',
    nullable: true,
    items: { type: 'string' },
  };

  let validator = factory(schema, '');
  let result = validate(validator, undefined);

  expect((result as ComplexValidationResult).isValid).toStrictEqual(true);
});

test('array validation fails if not nullable and given null', () => {
  let schema: OpenAPIV3.SchemaObject = {
    type: 'array',
    items: { type: 'string' },
  };

  let validator = factory(schema, '');
  let result = validate(validator, undefined);

  expect((result as ComplexValidationResult).isValid).toStrictEqual(false);
});
