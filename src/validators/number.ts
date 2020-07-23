import camelcase from "camelcase";
import { Validator } from "strickland";
import { ValidatorFactory, wrapNullable } from "./";

const factory: ValidatorFactory = (schema, propertyName) => {
  let camelCasePropertyName = camelcase(propertyName);

  let validators: Array<Validator> = [
    wrapNullable(
      schema,
      camelCasePropertyName,
      (v: any) =>
        typeof v === "number" || {
          isValid: false,
          message: `${camelCasePropertyName} must be a valid number`,
        }
    ),
  ];

  return validators;
};

export default factory;
