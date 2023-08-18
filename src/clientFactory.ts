import { backOff } from 'exponential-backoff';
import camelcase from 'camelcase';
import fetch, { RequestInit, HeadersInit } from 'node-fetch';
import http, { request } from 'http';
import https from 'https';
import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import validate from 'strickland';
import { URL } from 'url';

import { LoggerFunc } from '.';
import { parseSpecifications, SecuritySchema, Operation, Method } from './specParser';
import validatorFactory from './validatorFactory';
import propertyMapperFactory from './propertyMapperFactory';
import bodySerializerFactory from './bodySerializerFactory';
import { isComplexValidationResult, isBooleanValidationResult } from './validators';
import FormData from 'form-data';
import { convertKeysToCamelcase } from './utils';

const fetchBeforeSendOperations: { [key: string]: [string] } = {
  advertiser: ['update'],
  campaign: ['update'],
  ad: ['update'],
  channel: ['update'],
  creative: ['update'],
  flight: ['update'],
  priority: ['update'],
  site: ['update'],
  zone: ['update'],
  user: ['update'],
  siteZoneTargeting: ['update'],
  geoTargeting: ['update'],
};

export interface ClientFactoryOptions {
  specifications: Array<OpenAPIV3.Document>;
  apiKey: string;
  protocol?: 'http' | 'https';
  host?: string;
  port?: number;
  logger?: LoggerFunc;
  additionalVersionInfo?: string;
}

export interface RunOptions<TCurrent, TAcc> {
  callback?: (accumlator: TAcc, current: TCurrent) => TAcc;
  initialValue?: TAcc;
  retryStrategy?: 'disabled' | 'exponential' | 'exponential-jitter';
  maxRetries?: number;
}

export interface Client {
  run: <TCurrent extends {}, TAcc extends {}>(
    obj: string,
    op: string,
    body: any,
    opts?: RunOptions<TCurrent, TAcc>
  ) => Promise<any>;
}

interface Headers {
  [key: string]: string;
}

const defaultLogger: LoggerFunc = (lvl, msg, meta) =>
  process.stdout.write(`[${lvl}] ${msg} [${JSON.stringify(meta)}]\n`);

const addQueryParameters = async (
  url: URL,
  parameters: Array<OpenAPIV3.ParameterObject>,
  body: any,
  logger: LoggerFunc
): Promise<string> => {
  for (let p of parameters) {
    if (p.schema == undefined) {
      continue;
    }

    let validator = validatorFactory(p.schema as OpenAPIV3.SchemaObject, p.name);
    let cn = camelcase(p.name);
    let isOmitted = !body || !body[cn];

    if (isOmitted && p.required) {
      throw `${cn} is a required parameter`;
    }
    if (isOmitted && (p.schema as OpenAPIV3.NonArraySchemaObject).default == null) {
      continue;
    }

    let mapper = propertyMapperFactory(p.schema as OpenAPIV3.SchemaObject, logger);
    let value = await mapper((body || {})[cn]);

    let validationResult = validate(validator, value);
    if (
      (isComplexValidationResult(validationResult) && !validationResult.isValid) ||
      (isBooleanValidationResult(validationResult) && !validationResult)
    ) {
      throw `Value for ${cn} is invalid`;
    }

    url.searchParams.append(p.name, value.toString());
    if (cn !== 'id') {
      delete (body || {})[cn];
    }
  }

  return url.href;
};

const buildHeaders = (
  securitySchemes: SecuritySchema,
  operation: Operation,
  keys: any,
  additionalVersionInfo?: string,
  existingHeaders: Headers = {}
) => {
  let versionString = 'adzerk-management-sdk-js:{NPM_PACKAGE_VERSION}';

  if (!!additionalVersionInfo) {
    existingHeaders['X-Adzerk-Sdk-Version'] = `${additionalVersionInfo};${versionString}`;
  } else {
    existingHeaders['X-Adzerk-Sdk-Version'] = versionString;
  }

  return operation.securitySchemes.reduce((headers, ss) => {
    if (!securitySchemes[ss] || securitySchemes[ss].in !== 'header') {
      return headers;
    }
    headers[securitySchemes[ss].name] = keys[ss];
    return headers;
  }, existingHeaders);
};

const buildRequestArgs = async (
  client: Client | PromiseLike<Client>,
  headers: Headers,
  method: Method,
  agent: http.Agent,
  obj: string,
  op: string,
  body: any,
  operation: Operation,
  logger: LoggerFunc,
  originalBody: any
) => {
  let requestArgs: RequestInit = { headers, method, agent };
  let schema = operation.bodySchema;

  if (schema == undefined || !schema) {
    return requestArgs;
  }

  if (body == undefined) {
    throw 'Request requires a request body to be specified';
  }

  let contentType = Object.keys(schema)[0];
  let schemaPropertiesKeys = Object.keys(schema[contentType].properties || {});
  let camelCasedSchemaPropertiesKeys = schemaPropertiesKeys.map((k) => camelcase(k));

  let unmappedKeys = Object.keys(body).filter(
    (k) => !camelCasedSchemaPropertiesKeys.includes(k)
  );

  for (let k of unmappedKeys) {
    logger(
      'warn',
      `Property ${k} is not supported by this operation, it will be ignored`,
      {
        schema: obj,
        operation: op,
      }
    );
  }

  if (fetchBeforeSendOperations[obj] && fetchBeforeSendOperations[obj].includes(op)) {
    let c = await client;
    logger('debug', 'Fetching existing object before performing update', originalBody);
    let response = await c.run(obj, 'get', originalBody);
    logger('debug', 'Received response from get before update', response);
    body = { ...response, ...body };
    logger('debug', 'Proceeding with the following request body', body);
  }

  let buildIdOnlySchema = (isCapitalized: boolean): OpenAPIV3.NonArraySchemaObject =>
    isCapitalized
      ? {
        type: 'object',
        required: ['Id'],
        properties: { Id: { type: 'integer', format: 'int32' } },
      }
      : {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer', format: 'int32' } },
      };

  let serializer = bodySerializerFactory(contentType);
  let propertyNames = Object.keys(schema[contentType].properties || {});

  let schemaObject: OpenAPIV3.SchemaObject;

  if (fetchBeforeSendOperations[obj]?.includes(op)) {
    if (propertyNames.includes('id')) {
      schemaObject = buildIdOnlySchema(false);
    } else if (propertyNames.includes('Id')) {
      schemaObject = buildIdOnlySchema(true);
    } else {
      schemaObject = { type: 'object' };
    }
  } else {
    schemaObject = schema[contentType];
  }

  let validator = validatorFactory(schemaObject, '');

  let propertyMapper = propertyMapperFactory(schema[contentType], logger, {
    schema: obj,
    operation: op,
  });
  let mapped = await propertyMapper(body);

  logger('debug', 'Validating the following request', mapped);
  let validationResult = validate(validator, mapped);

  if (isComplexValidationResult(validationResult) && !validationResult.isValid) {
    if (validationResult.form == undefined) {
      logger('error', 'Request body is invalid');
    } else {
      logger(
        'error',
        'Request body is invalid',
        validationResult.form.validationErrors
      );
    }

    throw 'Request body is invalid';
  }

  if (isBooleanValidationResult(validationResult) && !validationResult) {
    logger('error', 'Request body is invalid');
  }

  requestArgs.body = await serializer(mapped);

  if (isFormData(requestArgs.body)) {
    let bh = requestArgs.body.getHeaders();
    if (requestArgs.headers == undefined) {
      requestArgs.headers = { 'Content-Type': bh['content-type'] };
    } else {
      (requestArgs.headers as { [key: string]: string })['Content-Type'] =
        bh['content-type'];
    }
  } else {
    (requestArgs.headers as { [key: string]: string })['content-type'] = contentType;
  }

  return requestArgs;
};

export async function buildClient(opts: ClientFactoryOptions): Promise<Client> {
  let [spec, securitySchemas] = await parseSpecifications(opts.specifications);
  let logger = opts.logger || defaultLogger;
  let protocol = opts.protocol || 'https';
  let host = opts.host || 'api.adzerk.net';
  let port = opts.port || 443;

  let agent = new (protocol === 'https' ? https : http).Agent({
    keepAlive: true,
  });

  return {
    async run(obj, op, body, qOpts) {
      let originalBody = body ? JSON.parse(JSON.stringify(body)) : null;
      let operation = spec[obj][op];
      let bodySchemaKeys = Object.keys(operation.bodySchema || {}).flatMap((ct) => {
        let bodySchema = operation.bodySchema || {};
        let schema = bodySchema[ct] || {};
        let properties = schema.properties || {};

        return Object.keys(properties).map((k) => k.toLowerCase());
      });

      let rawBaseUrl = operation.url;
      let baseUrl = operation.pathParameters.reduce((url, parameter) => {
        if (parameter.schema != undefined) {
          let validator = validatorFactory(
            parameter.schema as OpenAPIV3.SchemaObject,
            parameter.name
          );
          let validationResult = validate(validator, body[camelcase(parameter.name)]);
          if (
            (isComplexValidationResult(validationResult) && !validationResult.isValid) ||
            (isBooleanValidationResult(validationResult) && !validationResult)
          ) {
            throw `Value for ${parameter.name} is invalid`;
          }
        }

        let newUrl = url.replace(`{${parameter.name}}`, body[camelcase(parameter.name)]);
        if (!bodySchemaKeys.includes(parameter.name.toLowerCase())) {
          delete body[parameter.name];
        }
        return newUrl;
      }, rawBaseUrl);
      let url = new URL(`${protocol}://${host}:${port}${baseUrl}`);
      let href = await addQueryParameters(url, operation.queryParameters, body, logger);
      operation.queryParameters
        .filter((qp) => bodySchemaKeys.includes(qp.name.toLowerCase()))
        .forEach((qp) => delete body[qp.name]);

      let headers = buildHeaders(
        securitySchemas,
        operation,
        {
          ApiKeyAuth: opts.apiKey,
        },
        opts.additionalVersionInfo
      );
      let requestArgs = await buildRequestArgs(
        this,
        headers,
        operation.method,
        agent,
        obj,
        op,
        body,
        operation,
        logger,
        originalBody
      );

      let isRetryEnabled = (qOpts?.retryStrategy || 'exponential-jitter') === 'disabled';

      let r = await backOff(
        async () => {
          logger('info', 'Making request to Adzerk API', {
            href,
            requestArgs: {
              ...requestArgs,
              headers: {
                ...requestArgs.headers,
                'X-Adzerk-ApiKey': undefined
              }
            }
          });
          let ir = await fetch(href, requestArgs);
          if (ir.status == 429) {
            throw { type: 'client', code: 429 };
          }
          return ir;
        },
        {
          numOfAttempts: isRetryEnabled ? qOpts?.maxRetries || 5 : 1,
          jitter:
            (qOpts?.retryStrategy || 'exponential-jitter') == 'exponential-jitter'
              ? 'full'
              : 'none',
          retry: async (err, attemptNumber) => {
            logger(
              'info',
              `Request was rate limited. This was attempt ${attemptNumber}`
            );
            return err.code === 429;
          },
        }
      );

      if (r.status === 204) {
        return;
      }

      let responseBody = await r.json();

      if (![200, 201].includes(r.status)) {
        logger('debug', 'Received the following response from the Adzerk API', {
          status: r.status,
          body: responseBody,
        });

        throw responseBody;
      }

      if (op !== 'filter') {
        logger('debug', 'Received the following response from the Adzerk API', {
          status: r.status,
          body: responseBody,
        });
        return convertKeysToCamelcase(responseBody);
      }

      let callback =
        (qOpts && qOpts.callback) || ((acc: Array<any>, o: any) => (acc.push(o), acc));

      let result = await handleResponseStream(
        r.body,
        callback,
        (qOpts && qOpts.initialValue) || []
      );

      let converted = convertKeysToCamelcase(result);

      if (!r.ok) {
        logger('error', 'API Request failed', { response: r, body: converted });
      }

      return converted;
    },
  };
}

let handleResponseStream = async <TCurr, TAcc>(
  body: NodeJS.ReadableStream,
  callback: any,
  initialValue: TAcc
) => {
  let buffer = Buffer.alloc(0);

  return new Promise((resolve, reject) => {
    let accumulator = initialValue;
    body.on('data', (d) => {
      buffer = Buffer.concat([buffer, d]);
      try {
        buffer
          .toString()
          .trim()
          .split('\n')
          .forEach((l) => {
            try {
              let obj = convertKeysToCamelcase(JSON.parse(l));
              accumulator = callback(accumulator, obj);
              buffer = Buffer.alloc(0);
            } catch {
              buffer = Buffer.from(l);
              return;
            }
          });
      } catch (e) {
        reject(e);
      }
    });

    body.on('end', () => resolve(accumulator));

    body.on('close', () => resolve(accumulator));

    body.on('finish', () => resolve(accumulator));

    body.on('error', (e) => reject(e));
  });
};

const isFormData = (d: any): d is FormData => (d as FormData).getHeaders !== undefined;
