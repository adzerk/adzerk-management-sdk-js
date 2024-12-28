import camelcase from 'camelcase';
import format from 'date-fns/format/index.js';
import formatRFC3339 from 'date-fns/formatRFC3339/index.js';
import parseJSON from 'date-fns/parseJSON/index.js';
import fsl from 'fs';
import mapObject from 'map-obj';
import { OpenAPIV3 } from 'openapi-types';
import { LoggerFunc } from '.';

let fs = fsl.promises;

let factory = (
  schema: OpenAPIV3.SchemaObject,
  logger: LoggerFunc,
  meta: any = {}
) => async (obj: any) => {
  await logger('debug', 'Building mapper', {
    type: schema.type,
    format: schema.format,
  });

  if (
    schema.type !== 'object' &&
    schema.type !== 'array' &&
    !(
      schema.type === 'string' &&
      ['binary', 'date', 'date-time'].includes(schema.format || '')
    )
  ) {
    return obj != null ? obj : (schema as OpenAPIV3.NonArraySchemaObject).default;
  }

  if (schema.type == 'array') {
    if (!schema.items) {
      return obj;
    }
    let f = factory(schema.items as OpenAPIV3.SchemaObject, logger);
    let promises = obj.map(async (o: any) => await f(o));
    let results = await Promise.all(promises);
    return results;
  }

  if (schema.type === 'string' && schema.format === 'binary') {
    try {
      let stat = await fs.lstat(obj);

      if (stat.isFile()) {
        let file = await fs.readFile(obj);
        return file;
      }
    } catch {}

    return obj;
  }

  await logger('debug', 'Parsing property', {
    type: schema.type,
    format: schema.format,
  });

  if (schema.type === 'string' && schema.format === 'date') {
    await logger('debug', 'Parsing date when mapping');
    // using parseISO was causing a shift in timezone because iso values don't
    // include timezone. parseJSON assumes UTC but only works if a time is provided.
    // In this case, we can default a time value and proceed.
    let d = typeof obj === 'string' ? parseJSON(`${obj}T00:00:00.0000000`) : obj;
    return format(d, 'yyyy-MM-dd');
  }

  if (schema.type === 'string' && schema.format === 'date-time') {
    let d = typeof obj === 'string' ? parseJSON(obj) : obj;
    return formatRFC3339(d);
  }

  if ((schema as any)['x-property-casing']) {
    if (typeof obj !== 'object') {
      return obj;
    }
    let newObj = mapObject(
      obj,
      (k, v) => [camelcase(k as string, { pascalCase: true }), v],
      { deep: true }
    );
    obj = newObj;
    return obj;
  }

  if (!schema.properties) {
    return obj;
  }

  let schemaPropertiesKeys = Object.keys(schema.properties);

  let promises = schemaPropertiesKeys.map(async (k) => {
    let c = camelcase(k);

    if (schema.properties == undefined) {
      return;
    }

    let ls: OpenAPIV3.SchemaObject = schema.properties[k] as OpenAPIV3.SchemaObject;

    if (obj[c] == undefined && ls.default != undefined) {
      return [k, ls.default];
    }

    if (obj[c] == undefined) {
      return;
    }

    if (ls.deprecated) {
      await logger(
        'warn',
        `Property ${k} is deprecated and may be removed completely in the future`,
        {
          file: 'propertyMapper.js',
          line: 27,
        }
      );
    }

    let f = factory(ls, logger, meta);
    let v: any = await f(obj[c]);
    return [k, v];
  });

  let values = await Promise.all(promises);

  return values.reduce((agg, pair) => {
    if (pair == undefined) {
      return agg;
    }
    agg[pair[0]] = pair[1];
    return agg;
  }, {} as any);
};

export default factory;
