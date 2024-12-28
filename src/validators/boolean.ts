import camelcase from 'camelcase';
import { Validator } from 'strickland-esm';
import { ValidatorFactory, wrapNullable } from './';

const factory: ValidatorFactory = (schema, propertyName) => {
  let camelCasePropertyName = camelcase(propertyName);

  let validators: Array<Validator> = [
    wrapNullable(
      schema,
      camelCasePropertyName,
      (v: any) =>
        typeof v === 'boolean' || {
          isValid: false,
          message: `${camelCasePropertyName} must be a valid boolean`,
        }
    ),
  ];

  return validators;
};

export default factory;
