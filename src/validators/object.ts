import { form, Validator } from "strickland";
import { OpenAPIV3 } from "@apidevtools/swagger-parser/node_modules/openapi-types";
import camelcase from "camelcase";
import { ValidatorFactory } from ".";

const factory: ValidatorFactory = (schema, _propertyName): Validator => {
  let requiredProperties = schema.required || [];
  if (!schema.properties) {
    return (_) => true;
  }

  let children = Object.keys(schema.properties).reduce((agg, ck) => {
    if (schema.properties == undefined) {
      return agg;
    }
    let property = schema.properties[ck] as OpenAPIV3.SchemaObject;
    let validator = factory(property, ck);

    agg[ck] = !requiredProperties.includes(ck)
      ? validator
      : [
          (v) =>
            v != undefined || {
              isValid: false,
              message: `${camelcase(ck)} is required`,
            },
        ];

    return agg;
  }, {} as { [key: string]: Validator | Array<Validator> });

  return form(children);
};

export default factory;
