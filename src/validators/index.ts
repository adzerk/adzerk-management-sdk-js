import { OpenAPIV3 } from 'openapi-types';
import { ComplexValidationResult, ValidationResult, Validator } from 'strickland-esm';

import array from './array';
import boolean from './boolean';
import integer from './integer';
import number from './number';
import object from './object';
import string from './string';

export interface ValidatorMap {
  [key: string]: ValidatorFactory;
}

let validatorMap: ValidatorMap = {
  integer,
  boolean,
  number,
  string,
  object,
  array,
  null: (_: any) => (_: any) => true,
};

export default validatorMap;

export interface ValidatorFactory {
  (schema: OpenAPIV3.SchemaObject, propertyName: string, factory?: ValidatorFactory):
    | Validator
    | Array<Validator>;
}

export const wrapNullable = (
  schema: OpenAPIV3.SchemaObject,
  propertyName: string,
  validator: Validator
): Validator => (v) => {
  if (!!schema.nullable) {
    return v == undefined ? true : validator(v);
  }
  if (v == undefined) {
    return { isValid: false, message: `${propertyName} is not nullable` };
  }
  return validator(v);
};

export function isComplexValidationResult(
  result: ValidationResult
): result is ComplexValidationResult {
  return (result as ComplexValidationResult).isValid != undefined;
}

export function isBooleanValidationResult(result: ValidationResult): result is boolean {
  return typeof result === 'boolean';
}
