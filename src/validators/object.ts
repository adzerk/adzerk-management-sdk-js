import camelcase from 'camelcase';
import { OpenAPIV3 } from 'openapi-types';
import { form, Validator } from 'strickland-esm';
import { ValidatorFactory } from '.';


const factory: ValidatorFactory = (schema, _propertyName, pf): Validator => {
  if (pf == undefined) {
    throw 'Parent Factory for Object Validator Factory must not be null';
  }

  let requiredProperties = schema.required || [];
  if (!schema.properties) {
    return (_) => true;
  }

  let children = Object.keys(schema.properties).reduce((agg, ck) => {
    if (schema.properties == undefined) {
      return agg;
    }
    let property = schema.properties[ck] as OpenAPIV3.SchemaObject;
    let validator = pf(property, ck);

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
