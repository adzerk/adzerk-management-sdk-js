import { OpenAPIV3 } from "@apidevtools/swagger-parser/node_modules/openapi-types";
import { Validator } from "strickland";

import integer from "./integer";
import boolean from "./boolean";
import number from "./number";
import string from "./string";
import object from "./object";
import array from "./array";

export default {
  integer,
  boolean,
  number,
  string,
  object,
  array,
};

export interface ValidatorFactory {
  (schema: OpenAPIV3.SchemaObject, propertyName: string):
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
