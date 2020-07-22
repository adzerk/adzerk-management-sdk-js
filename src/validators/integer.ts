import { ValidatorFactory, Validator, wrapNullable } from "./";
import camelcase from "camelcase";

const factory: ValidatorFactory = (schema, propertyName) => {
  let camelCasePropertyName = camelcase(propertyName);

  let validators: Array<Validator> = [
    wrapNullable(
      schema,
      camelCasePropertyName,
      (v: any) =>
        (typeof v === "number" && Number.isInteger(v)) || {
          isValid: false,
          message: `${camelCasePropertyName} must be a valid integer`,
        }
    ),
  ];

  return validators;
};

export default factory;
