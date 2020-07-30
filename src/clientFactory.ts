import camelcase from "camelcase";
import http from "http";
import https from "https";
import { OpenAPIV3 } from "@apidevtools/swagger-parser/node_modules/openapi-types";
import validate from "strickland";
import { URL } from "url";

import { LoggerFunc } from ".";
import {
  parseSpecifications,
  SecuritySchema,
  Operation,
  Method,
  BodySchema,
} from "./specParser";
import validatorFactory from "./validatorFactory";
import propertyMapperFactory from "./propertyMapperFactory";
import bodySerializerFactory from "./bodySerializerFactory";

const fetchBeforeSendOperations: { [key: string]: [string] } = {
  advertiser: ["update"],
};

export interface ClientFactoryOptions {
  protocol?: "http" | "https";
  host?: string;
  port?: number;
  logger?: LoggerFunc;
  specifications?: Array<string>;
}

export interface RunOptions<TCurrent, TAcc> {
  callback?: (accumlator: TAcc, current: TCurrent) => TAcc;
  initialValue?: TAcc;
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

    let validator = validatorFactory(
      p.schema as OpenAPIV3.SchemaObject,
      p.name
    );
    let cn = camelcase(p.name);
    let isOmitted = !body || !body[cn];

    if (isOmitted && p.required) {
      throw `${cn} is a required parameter`;
    }
    if (isOmitted) {
      continue;
    }

    let validationResult = validate(validator, body[cn]);
    if (!validationResult.isValid) {
      throw `Value for ${cn} is invalid`;
    }

    let mapper = propertyMapperFactory(
      p.schema as OpenAPIV3.SchemaObject,
      logger
    );
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
  return operation.securitySchemes.reduce((headers, ss) => {
    if (!securitySchemes[ss] || securitySchemes[ss].in !== "header") {
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
  operation: Operation
) => {
  let requestArgs = { headers, method, agent };
  let schema = operation.bodySchema;

  if (schema == undefined) {
    return requestArgs;
  }
  if (body == undefined) {
    throw "Request requires a request body to be specified";
  }

  if (
    fetchBeforeSendOperations[obj] &&
    fetchBeforeSendOperations[obj].includes(op)
  ) {
    let c = await client;
    let key = `${obj}Id`;
    let getBody = { [key]: body[key] };
    let response = c.run(obj, "get", getBody);
    delete body[key];

    body = { ...response, ...body };
  }

  let contentType = Object.keys(schema)[0];
  let serializer = bodySerializerFactory(contentType);
  // let validator = validatorFactory(operation.bodySchema[contentType], '');
};

export const buildClient = async (
  adzerkApiKey: string,
  opts: ClientFactoryOptions
): Promise<Client> => {
  let [spec, securitySchemas] = await parseSpecifications(opts.specifications);
  let logger = opts.logger || noop;
  let protocol = opts.protocol || "https";
  let host = opts.host || "api.adzerk.net";
  let port = opts.port || 443;

  let agent = new (protocol === "https" ? https : http).Agent({
    keepAlive: true,
  });

  return {
    async run(obj, op, body, opts) {
      let operation = spec[obj][op];
      let rawBaseUrl = operation.url;
      let baseUrl = operation.pathParameters.reduce(
        (url, parameter) =>
          url.replace(`{${parameter.name}}`, body[camelcase(parameter.name)]),
        rawBaseUrl
      );
      let url = new URL(`${protocol}://${host}:${port}${baseUrl}`);
      let href = addQueryParameters(
        url,
        operation.queryParameters,
        body,
        logger
      );
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
        operation
      );
    },
  };
};
