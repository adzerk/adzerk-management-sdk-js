import { OpenAPIV3 } from "@apidevtools/swagger-parser/node_modules/openapi-types";

import integer from "./integer";
import boolean from "./boolean";
import number from "./number";

export default {
  integer,
  boolean,
  number,
};

export interface Validator {
  (value?: any): boolean | { isValid: boolean; message: string };
}

export interface ValidatorFactory {
  (schema: OpenAPIV3.SchemaObject, propertyName: string): Array<Validator>;
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
