import camelcase from "camelcase";
import merge from "deepmerge";
import { OpenAPIV3 } from "@apidevtools/swagger-parser/node_modules/openapi-types";
import SwaggerParser from "@apidevtools/swagger-parser";

type VerbRecord<K extends keyof any, T> = {
  [P in K]: T;
};

type Verb = "post" | "get" | "patch" | "put" | "delete";

const verbToMethod = {
  post: "POST",
  get: "GET",
  patch: "PATCH",
  put: "PUT",
  delete: "DELETE",
} as VerbRecord<Verb, "POST" | "GET" | "PATCH" | "PUT" | "DELETE">;

interface Contract {
  [key: string]: {
    [operationId: string]: {
      method: string;
      url: string;
      pathParameters: Array<OpenAPIV3.ParameterObject>;
      queryParameters: Array<OpenAPIV3.ParameterObject>;
      headerParameters: Array<OpenAPIV3.ParameterObject>;
      securitySchemes: Array<string>;
      bodySchema: {
        [contentType: string]: {
          schema: OpenAPIV3.SchemaObject;
        };
      };
    };
  };
}

interface SecuritySchema {
  [key: string]: OpenAPIV3.SecuritySchemeObject;
}

export const latestSpecifications: Array<string> = [
  "../adzerk-api-specification/management/advertiser.yaml",
  "../adzerk-api-specification/management/creative-template.yaml",
  "../adzerk-api-specification/management/creative.yaml",
  "../adzerk-api-specification/management/flight.yaml",
];

export const buildSpecificationList = (
  version: string = "master",
  basePath: string = `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/${version}/management`
): Array<string> => {
  return [
    `${basePath}/advertiser.yaml`,
    `${basePath}/creative-template.yaml`,
    `${basePath}/creative.yaml`,
    `${basePath}/flight.yaml`,
  ];
};

export const fetchSpecifications = async (
  specList: Array<string>
): Promise<Array<OpenAPIV3.Document>> => {
  let promises = specList.map((s) => SwaggerParser.bundle(s));
  let results = await Promise.all(promises);

  return results as Array<OpenAPIV3.Document>;
};

export const parseSpecifications = async (
  specList: Array<string> = buildSpecificationList()
): Promise<[Contract, SecuritySchema]> => {
  let specs = await fetchSpecifications(specList);
  let contract = specs
    .flatMap((r) => r.tags || [])
    .reduce((agg, v) => ((agg[camelcase(v.name)] = {}), agg), {} as Contract);

  let paths = specs.reduce(
    (agg, p) => merge(agg, p.paths),
    {} as OpenAPIV3.PathsObject
  );
  let components = specs.reduce(
    (agg, p) => merge(agg, p.components || {}),
    {} as OpenAPIV3.ComponentsObject
  );

  for (let key of Object.keys(paths)) {
    let p = paths[key];

    let pathParameters = p.parameters || [];

    for (let verb of Object.keys(p).filter((k) => k !== "parameters") as Array<
      Verb
    >) {
      let o = (p as any)[verb] as OpenAPIV3.OperationObject;

      (o.tags || []).forEach((t) => {
        let k = camelcase(t);
        let allParameters = [...pathParameters, ...(o.parameters || [])];
        let requestBody = o.requestBody as OpenAPIV3.RequestBodyObject;

        contract[k][o.operationId || ""] = {
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
            case "path":
              contract[k][o.operationId || ""].pathParameters.push(p);
              break;
            case "query":
              contract[k][o.operationId || ""].queryParameters.push(p);
              break;
            case "header":
              contract[k][o.operationId || ""].headerParameters.push(p);
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
