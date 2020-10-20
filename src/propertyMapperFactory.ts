import camelcase from 'camelcase';
import format from 'date-fns/format';
import parseISO from 'date-fns/parseISO';
import formatRFC3339 from 'date-fns/formatRFC3339';
import { OpenAPIV3 } from 'openapi-types';
import fsl from 'fs';
import { LoggerFunc } from '.';

let fs = fsl.promises;

let factory = (
  schema: OpenAPIV3.SchemaObject,
  logger: LoggerFunc,
  meta: any = {}
) => async (obj: any) => {
  logger('debug', 'Building mapper', {
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
    return obj;
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

  logger('debug', 'Parsing property', {
    type: schema.type,
    format: schema.format,
  });

  if (schema.type === 'string' && schema.format === 'date') {
    logger('debug', 'Parsing date when mapping');
    let d = typeof obj === 'string' ? parseISO(obj) : obj;
    return format(d, 'yyyy-MM-dd');
  }

  if (schema.type === 'string' && schema.format === 'date-time') {
    let d = typeof obj === 'string' ? parseISO(obj) : obj;
    return formatRFC3339(d);
  }

  if (!schema.properties) {
    return obj;
  }

  let schemaPropertiesKeys = Object.keys(schema.properties);
  let camelCasedSchemaPropertiesKeys = schemaPropertiesKeys.map((k) => camelcase(k));

  let unmappedKeys = Object.keys(obj).filter(
    (k) => !camelCasedSchemaPropertiesKeys.includes(k)
  );
  unmappedKeys.forEach((k) => {
    logger(
      'warn',
      `Property ${k} is not supported by this operation, it will be ignored`,
      { ...meta, file: 'properMapper.js', line: 15 }
    );
  });

  return schemaPropertiesKeys.reduce(async (agg, k) => {
    let c = camelcase(k);

    if (schema.properties == undefined) {
      return agg;
    }

    let ls: OpenAPIV3.SchemaObject = schema.properties[k] as OpenAPIV3.SchemaObject;

    if (obj[c] == undefined && ls.default != undefined) {
      agg[k] = ls.default;
      return agg;
    }

    if (obj[c] == undefined) {
      return agg;
    }

    if (ls.deprecated) {
      logger(
        'warn',
        `Property ${k} is deprecated and may be removed completely in the future`,
        {
          file: 'propertyMapper.js',
          line: 27,
        }
      );
    }

    let f = factory(ls, logger, meta);
    agg[k] = await f(obj[c]);
    return agg;
  }, {} as any);
};

export default factory;
