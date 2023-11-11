import flatMap from 'array.prototype.flatmap';
import camelcase from 'camelcase';
import merge from 'deepmerge';
import { OpenAPIV3 } from 'openapi-types';
import SwaggerParser from '@apidevtools/swagger-parser';

flatMap.shim();

type VerbRecord<K extends keyof any, T> = {
  [P in K]: T;
};

type Verb = 'post' | 'get' | 'patch' | 'put' | 'delete';

export type Method = 'POST' | 'GET' | 'PATCH' | 'PUT' | 'DELETE';

const verbToMethod = {
  post: 'POST',
  get: 'GET',
  patch: 'PATCH',
  put: 'PUT',
  delete: 'DELETE',
} as VerbRecord<Verb, Method>;

export interface Contract {
  [key: string]: {
    [operationId: string]: Operation;
  };
}

export interface BodySchema {
  [contentType: string]: OpenAPIV3.SchemaObject;
}

export interface Operation {
  method: Method;
  url: string;
  pathParameters: Array<OpenAPIV3.ParameterObject>;
  queryParameters: Array<OpenAPIV3.ParameterObject>;
  headerParameters: Array<OpenAPIV3.ParameterObject>;
  securitySchemes: Array<string>;
  bodySchema?: BodySchema;
}

export interface SecuritySchema {
  [key: string]: OpenAPIV3.ApiKeySecurityScheme;
}

export interface FullSpecificationListOptions {
  version?: string;
  basePath?: string;
}

export interface PartialSpecificationListOptions {
  objects: Array<string>;
  version?: string;
  basePath?: string;
}

export const buildFullSpecificationList = (
  opts: FullSpecificationListOptions = {}
): Array<string> => {
  let basePath =
    opts.basePath ??
    (opts.version
      ? `https://openapi.kevel.co/${opts.version}`
      : 'https://openapi.kevel.co');

  return [
    `${basePath}/advertiser.yaml`,
    `${basePath}/creative-template.yaml`,
    `${basePath}/creative.yaml`,
    `${basePath}/flight.yaml`,
    `${basePath}/ad.yaml`,
    `${basePath}/ad-type.yaml`,
    `${basePath}/campaign.yaml`,
    `${basePath}/channel.yaml`,
    `${basePath}/channel-site-map.yaml`,
    `${basePath}/entity-counts.yaml`,
    `${basePath}/flight-category.yaml`,
    `${basePath}/geo-targeting.yaml`,
    `${basePath}/priority.yaml`,
    `${basePath}/site-zone-targeting.yaml`,
    `${basePath}/site.yaml`,
    `${basePath}/zone.yaml`,
    `${basePath}/queued-report.yaml`,
    `${basePath}/scheduled-report.yaml`,
    `${basePath}/real-time-report.yaml`,
    `${basePath}/day-part.yaml`,
    `${basePath}/user.yaml`,
    `${basePath}/distance-targeting.yaml`,
  ];
};

export const buildPartialSpecificationList = (
  opts: PartialSpecificationListOptions
): Array<string> => {
  let basePath =
    opts.basePath ??
    (opts.version
      ? `https://openapi.kevel.co/${opts.version}`
      : 'https://openapi.kevel.co');
  return opts.objects.map((o) => `${basePath}/${o}.yaml`);
};

export const fetchSpecifications = async (
  specList: Array<string> = buildFullSpecificationList()
): Promise<Array<OpenAPIV3.Document>> => {
  let promises = specList.map((s) => SwaggerParser.dereference(s));
  let results = await Promise.all(promises);

  return results as Array<OpenAPIV3.Document>;
};

export const parseSpecifications = async (
  specs: Array<OpenAPIV3.Document>
): Promise<[Contract, SecuritySchema]> => {
  specs = specs ?? (await fetchSpecifications());
  let contract = specs
    .flatMap((r) => r.tags || [])
    .reduce((agg, v) => ((agg[camelcase(v.name)] = {}), agg), {} as Contract);

  let paths = specs.reduce((agg, p) => merge(agg, p.paths), {} as OpenAPIV3.PathsObject);
  let components = specs.reduce(
    (agg, p) => merge(agg, p.components || {}),
    {} as OpenAPIV3.ComponentsObject
  );

  for (let key of Object.keys(paths)) {
    let p = paths[key];

    let pathParameters = p.parameters || [];

    for (let verb of Object.keys(p).filter((k) => k !== 'parameters') as Array<Verb>) {
      let o = (p as any)[verb] as OpenAPIV3.OperationObject;

      (o.tags || []).forEach((t) => {
        let k = camelcase(t);
        let allParameters = [...pathParameters, ...(o.parameters || [])];
        let requestBody = o.requestBody as OpenAPIV3.RequestBodyObject;

        if (contract[k] == undefined) {
          contract[k] = {};
        }

        contract[k][o.operationId || ''] = {
          method: verbToMethod[verb],
          url: key,
          pathParameters: [],
          queryParameters: [],
          headerParameters: [],
          securitySchemes: (o.security || []).flatMap((s) => Object.keys(s)),
          bodySchema:
            !!requestBody &&
            !!requestBody.content &&
            Object.keys(requestBody.content).reduce((agg, ct) => {
              if (!requestBody.content[ct]) {
                return agg;
              }
              (agg as any)[ct] = requestBody.content[ct].schema;
              return agg;
            }, {}),
        };

        for (var p of allParameters as Array<OpenAPIV3.ParameterObject>) {
          switch (p.in) {
            case 'path':
              contract[k][o.operationId || ''].pathParameters.push(p);
              break;
            case 'query':
              contract[k][o.operationId || ''].queryParameters.push(p);
              break;
            case 'header':
              contract[k][o.operationId || ''].headerParameters.push(p);
              break;
            default:
              throw `Unsupported parameter type in ${o.operationId}`;
          }
        }
      });
    }
  }

  return [contract, components.securitySchemes as SecuritySchema];
};
