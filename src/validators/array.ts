import camelcase from 'camelcase';
import { OpenAPIV3 } from 'openapi-types';
import validate, {
  ComplexValidationResult,
  ValidationResult,
  Validator,
} from 'strickland-esm';
import validatorFactory from '../validatorFactory';
import { ValidatorFactory, wrapNullable } from './';

const factory: ValidatorFactory = (schema, propertyName) => {
  let camelCasePropertyName = camelcase(propertyName);

  let validators: Array<Validator> = [
    wrapNullable(
      schema,
      camelCasePropertyName,
      (v: any) =>
        Array.isArray(v) || {
          isValid: false,
          message: `${camelCasePropertyName} must be an Array`,
        }
    ),
  ];

  if (!(schema as OpenAPIV3.ArraySchemaObject).items) {
    return validators;
  }

  let itemValidator = validatorFactory(
    (schema as OpenAPIV3.ArraySchemaObject).items as OpenAPIV3.SchemaObject,
    'item'
  );

  validators.push((v: Array<any>) => {
    if (v == undefined) {
      return schema.nullable
        ? true
        : { isValid: false, message: `${propertyName} is not nullable` };
    }

    let [isValid, validationResults]: [boolean, Array<ValidationResult>] = v.reduce(
      ([iv, rs]: [boolean, Array<ValidationResult>], i) => {
        let vr: ValidationResult = validate(itemValidator, i);
        rs.push(vr);
        return [iv && (isValidationResult(vr) ? vr.isValid : vr), rs];
      },
      [true, []] as [boolean, Array<ValidationResult>]
    );

    return (
      isValid || {
        isValid: false,
        validationResults,
        message: 'At least one child is invalid',
      }
    );
  });

  return validators;
};

let isValidationResult = (
  validationResult: any
): validationResult is ComplexValidationResult =>
  (validationResult as ComplexValidationResult).isValid != undefined;

export default factory;
