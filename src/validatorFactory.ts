import { every } from "strickland";
import { OpenAPIV3 } from "@apidevtools/swagger-parser/node_modules/openapi-types";
import validatorMap, { ValidatorFactory } from "./validators";

const factory: ValidatorFactory = (
  schema: OpenAPIV3.SchemaObject,
  propertyName: string
) => {
  let typeValidatorFactory = validatorMap[schema.type];
  if (!typeValidatorFactory) {
    return (_) => true;
  }

  let validator = validatorMap[schema.type](schema, propertyName, factory);
  if (Array.isArray(validator)) {
    return every(validator);
  }
  return validator;
};

export default factory;
