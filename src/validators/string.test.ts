import 'jest';
import { OpenAPIV3 } from 'openapi-types';
import factory from './array';
import validate, { ComplexValidationResult } from 'strickland';

test('string validation succeeds if nullable enum and given null', () => {
  let schema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {
      field: {
        type: 'string',
        nullable: true,
        enum: ['a', 'b', 'c'],
      },
    },
  };

  let validator = factory(schema, '');
  let result = validate(validator, { field: undefined });

  expect((result as ComplexValidationResult).isValid).toStrictEqual(true);
});
