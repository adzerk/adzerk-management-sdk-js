import camelcase from "camelcase";
import http from "http";
import https from "https";
import { OpenAPIV3 } from "@apidevtools/swagger-parser/node_modules/openapi-types";
import { URL } from "url";

import { LoggerFunc } from ".";
import { parseSpecifications } from "./specParser";

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
    opts: RunOptions<TCurrent, TAcc>
  ) => Promise<any>;
}

const noop = () => {};

const addQueryParameters = (
  url: URL,
  parameters: Array<OpenAPIV3.ParameterObject>
): URL => {
  return url;
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

      url = addQueryParameters(url, operation.queryParameters);
    },
  };
};
