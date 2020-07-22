import { ValidatorFactory, Validator, wrapNullable } from "./";
import camelcase from "camelcase";

const factory: ValidatorFactory = (schema, propertyName) => {
  let camelCasePropertyName = camelcase(propertyName);

  let validators: Array<Validator> = [
    wrapNullable(
      schema,
      camelCasePropertyName,
      (v: any) =>
        typeof v === "boolean" || {
          isValid: false,
          message: `${camelCasePropertyName} must be a valid boolean`,
        }
    ),
  ];

  return validators;
};

export default factory;
