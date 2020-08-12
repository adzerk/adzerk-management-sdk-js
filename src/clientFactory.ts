import { backOff } from 'exponential-backoff';
import camelcase from 'camelcase';
import fetch, { RequestInit, HeadersInit } from 'node-fetch';
import http, { request } from 'http';
import https from 'https';
import { OpenAPIV3 } from 'openapi-types';
import validate from 'strickland';
import { URL } from 'url';

import { LoggerFunc } from '.';
import {
  parseSpecifications,
  SecuritySchema,
  Operation,
  Method,
  BodySchema,
} from './specParser';
import validatorFactory from './validatorFactory';
import propertyMapperFactory from './propertyMapperFactory';
import bodySerializerFactory from './bodySerializerFactory';
import { isComplexValidationResult, isBooleanValidationResult } from './validators';
import FormData from 'form-data';
import { convertKeysToCamelcase } from './utils';

const fetchBeforeSendOperations: { [key: string]: [string] } = {
  advertiser: ['update'],
};

export interface ClientFactoryOptions {
  protocol?: 'http' | 'https';
  host?: string;
  port?: number;
  logger?: LoggerFunc;
  specifications?: Array<string>;
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

const noop = () => {};

const addQueryParameters = (
  url: URL,
  parameters: Array<OpenAPIV3.ParameterObject>,
  body: any,
  logger: LoggerFunc
): string => {
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
    if (isOmitted) {
      continue;
    }

    let validationResult = validate(validator, body[cn]);
    if (
      (isComplexValidationResult(validationResult) && !validationResult.isValid) ||
      (isBooleanValidationResult(validationResult) && !validationResult)
    ) {
      throw `Value for ${cn} is invalid`;
    }

    let mapper = propertyMapperFactory(p.schema as OpenAPIV3.SchemaObject, logger);
    url.searchParams.append(p.name, mapper(body[cn]).toString());
    delete body[cn];
  }

  return url.href;
};

const buildHeaders = (
  securitySchemes: SecuritySchema,
  operation: Operation,
  keys: any,
  existingHeaders: Headers = {}
) => {
  existingHeaders['X-Adzerk-Sdk-Version'] =
    'adzerk-management-sdk-js:{NPM_PACKAGE_VERSION}';
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
  logger: LoggerFunc
) => {
  let requestArgs: RequestInit = { headers, method, agent };
  let schema = operation.bodySchema;

  if (schema == undefined || !schema) {
    return requestArgs;
  }

  if (body == undefined) {
    throw 'Request requires a request body to be specified';
  }

  if (fetchBeforeSendOperations[obj] && fetchBeforeSendOperations[obj].includes(op)) {
    let c = await client;
    let key = `${obj}Id`;
    let getBody = { [key]: body[key] };
    let response = c.run(obj, 'get', getBody);
    delete body[key];

    body = { ...response, ...body };
  }

  let contentType = Object.keys(schema)[0];
  let serializer = bodySerializerFactory(contentType);
  let validator = validatorFactory(schema[contentType], '');
  let propertyMapper = propertyMapperFactory(schema[contentType], logger, {
    schema: obj,
    operation: op,
  });
  let mapped = propertyMapper(body);

  let validationResult = validate(validator, mapped);

  if (isComplexValidationResult(validationResult) && !validationResult.isValid) {
    if (validationResult.form == undefined) {
      logger('error', 'Request body is invalid');
    } else {
      logger('error', 'Request body is invalid', validationResult.form.validationErrors);
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

export const buildClient = async (
  adzerkApiKey: string,
  opts: ClientFactoryOptions
): Promise<Client> => {
  let [spec, securitySchemas] = await parseSpecifications(opts.specifications);
  let logger = opts.logger || noop;
  let protocol = opts.protocol || 'https';
  let host = opts.host || 'api.adzerk.net';
  let port = opts.port || 443;

  let agent = new (protocol === 'https' ? https : http).Agent({
    keepAlive: true,
  });

  return {
    async run(obj, op, body, qOpts) {
      let operation = spec[obj][op];
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
        return url.replace(`{${parameter.name}}`, body[camelcase(parameter.name)]);
      }, rawBaseUrl);
      let url = new URL(`${protocol}://${host}:${port}${baseUrl}`);
      let href = addQueryParameters(url, operation.queryParameters, body, logger);
      let headers = buildHeaders(securitySchemas, operation, {
        ApiKeyAuth: adzerkApiKey,
      });
      let requestArgs = await buildRequestArgs(
        this,
        headers,
        operation.method,
        agent,
        obj,
        op,
        body,
        operation,
        logger
      );

      let isRetryEnabled = (qOpts?.retryStrategy || 'exponential-jitter') === 'disabled';

      let r = await backOff(
        async () => {
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
          retry: (err, attemptNumber) => (
            logger('info', `Request was rate limited. This was attempt ${attemptNumber}`),
            err.code === 429
          ),
        }
      );

      if (!r.ok) {
        logger('error', 'API Request failed', r);
      }

      if (op !== 'filter') {
        return convertKeysToCamelcase(await r.json());
      }

      let callback =
        (qOpts && qOpts.callback) || ((acc: Array<any>, o: any) => (acc.push(o), acc));

      return convertKeysToCamelcase(
        await handleResponseStream(r.body, callback, (qOpts && qOpts.initialValue) || [])
      );
    },
  };
};

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
      } catch {}
    });

    body.on('close', () => resolve(accumulator));

    body.on('finish', () => resolve(accumulator));

    body.on('error', (e) => reject(e));
  });
};

const isFormData = (d: any): d is FormData => (d as FormData).getHeaders !== undefined;
