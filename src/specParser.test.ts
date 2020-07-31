import 'jest';

import { buildSpecificationList, parseSpecifications } from './specParser';

test('buildSpecificationList returns a github url if only version specified', () => {
  let sl = buildSpecificationList('v1.0.1');
  expect(sl).toStrictEqual([
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/advertiser.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/creative-template.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/creative.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/flight.yaml`,
  ]);
});

test('buildSpecificationList returns the base path and ignores version if base path specified', () => {
  let sl = buildSpecificationList(undefined, '../test/fixtures');
  expect(sl).toStrictEqual([
    '../test/fixtures/advertiser.yaml',
    '../test/fixtures/creative-template.yaml',
    '../test/fixtures/creative.yaml',
    '../test/fixtures/flight.yaml',
  ]);
});

test('parseSpecifications properly parses and transforms an OpenAPI v3 spec', async () => {
  let [contract, securitySchemes] = await parseSpecifications([
    './test/fixtures/petstore.json',
  ]);

  expect(securitySchemes).toStrictEqual({
    ApiKeyAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'X-Auth-Header',
    },
  });

  expect(contract).toStrictEqual({
    pets: {
      listPets: {
        method: 'GET',
        url: '/pets',
        pathParameters: [],
        queryParameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'How many items to return at one time (max 100)',
            required: false,
            schema: { type: 'integer', format: 'int32' },
          },
        ],
        headerParameters: [],
        securitySchemes: [],
        bodySchema: false,
      },
      createPets: {
        method: 'POST',
        url: '/pets',
        pathParameters: [],
        queryParameters: [],
        headerParameters: [],
        securitySchemes: [],
        bodySchema: {
          'application/json': {
            type: 'object',
            required: ['id', 'name'],
            properties: {
              id: { type: 'integer', format: 'int64' },
              name: { type: 'string' },
              tag: { type: 'string' },
            },
          },
        },
      },
      showPetById: {
        method: 'GET',
        url: '/pets/{petId}',
        pathParameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            description: 'The id of the pet to retrieve',
            schema: { type: 'string' },
          },
        ],
        queryParameters: [],
        headerParameters: [],
        securitySchemes: [],
        bodySchema: false,
      },
    },
  });
});
