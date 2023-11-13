import 'jest';

import {
  buildFullSpecificationList,
  parseSpecifications,
  buildPartialSpecificationList,
  fetchSpecifications,
} from './specParser';

test('buildFullSpecificationList returns a master github url if no options specified', () => {
  let sl = buildFullSpecificationList();
  expect(sl).toStrictEqual([
    `https://openapi.kevel.co/advertiser.yaml`,
    `https://openapi.kevel.co/creative-template.yaml`,
    `https://openapi.kevel.co/creative.yaml`,
    `https://openapi.kevel.co/flight.yaml`,
    `https://openapi.kevel.co/ad.yaml`,
    `https://openapi.kevel.co/ad-type.yaml`,
    `https://openapi.kevel.co/campaign.yaml`,
    `https://openapi.kevel.co/channel.yaml`,
    `https://openapi.kevel.co/channel-site-map.yaml`,
    `https://openapi.kevel.co/entity-counts.yaml`,
    `https://openapi.kevel.co/flight-category.yaml`,
    `https://openapi.kevel.co/geo-targeting.yaml`,
    `https://openapi.kevel.co/priority.yaml`,
    `https://openapi.kevel.co/site-zone-targeting.yaml`,
    `https://openapi.kevel.co/site.yaml`,
    `https://openapi.kevel.co/zone.yaml`,
    `https://openapi.kevel.co/queued-report.yaml`,
    `https://openapi.kevel.co/scheduled-report.yaml`,
    `https://openapi.kevel.co/real-time-report.yaml`,
    `https://openapi.kevel.co/day-part.yaml`,
    `https://openapi.kevel.co/user.yaml`,
    `https://openapi.kevel.co/distance-targeting.yaml`,
  ]);
});

test('buildFullSpecificationList returns a github url if only version specified', () => {
  let sl = buildFullSpecificationList({ version: 'v1.0.1' });
  expect(sl).toStrictEqual([
    `https://openapi.kevel.co/v1.0.1/advertiser.yaml`,
    `https://openapi.kevel.co/v1.0.1/creative-template.yaml`,
    `https://openapi.kevel.co/v1.0.1/creative.yaml`,
    `https://openapi.kevel.co/v1.0.1/flight.yaml`,
    `https://openapi.kevel.co/v1.0.1/ad.yaml`,
    `https://openapi.kevel.co/v1.0.1/ad-type.yaml`,
    `https://openapi.kevel.co/v1.0.1/campaign.yaml`,
    `https://openapi.kevel.co/v1.0.1/channel.yaml`,
    `https://openapi.kevel.co/v1.0.1/channel-site-map.yaml`,
    `https://openapi.kevel.co/v1.0.1/entity-counts.yaml`,
    `https://openapi.kevel.co/v1.0.1/flight-category.yaml`,
    `https://openapi.kevel.co/v1.0.1/geo-targeting.yaml`,
    `https://openapi.kevel.co/v1.0.1/priority.yaml`,
    `https://openapi.kevel.co/v1.0.1/site-zone-targeting.yaml`,
    `https://openapi.kevel.co/v1.0.1/site.yaml`,
    `https://openapi.kevel.co/v1.0.1/zone.yaml`,
    `https://openapi.kevel.co/v1.0.1/queued-report.yaml`,
    `https://openapi.kevel.co/v1.0.1/scheduled-report.yaml`,
    `https://openapi.kevel.co/v1.0.1/real-time-report.yaml`,
    `https://openapi.kevel.co/v1.0.1/day-part.yaml`,
    `https://openapi.kevel.co/v1.0.1/user.yaml`,
    `https://openapi.kevel.co/v1.0.1/distance-targeting.yaml`,
  ]);
});

test('buildFullSpecificationList returns the base path and ignores version if base path specified', () => {
  let sl = buildFullSpecificationList({ basePath: '../test/fixtures' });
  expect(sl).toStrictEqual([
    '../test/fixtures/advertiser.yaml',
    '../test/fixtures/creative-template.yaml',
    '../test/fixtures/creative.yaml',
    '../test/fixtures/flight.yaml',
    '../test/fixtures/ad.yaml',
    '../test/fixtures/ad-type.yaml',
    '../test/fixtures/campaign.yaml',
    '../test/fixtures/channel.yaml',
    '../test/fixtures/channel-site-map.yaml',
    '../test/fixtures/entity-counts.yaml',
    '../test/fixtures/flight-category.yaml',
    '../test/fixtures/geo-targeting.yaml',
    '../test/fixtures/priority.yaml',
    '../test/fixtures/site-zone-targeting.yaml',
    '../test/fixtures/site.yaml',
    '../test/fixtures/zone.yaml',
    '../test/fixtures/queued-report.yaml',
    '../test/fixtures/scheduled-report.yaml',
    '../test/fixtures/real-time-report.yaml',
    '../test/fixtures/day-part.yaml',
    '../test/fixtures/user.yaml',
    '../test/fixtures/distance-targeting.yaml',
  ]);
});

test('buildPartialSpecificationList returns a master github url if no options specified', () => {
  let sl = buildPartialSpecificationList({ objects: ['ad', 'creative-template'] });
  expect(sl).toStrictEqual([
    `https://openapi.kevel.co/ad.yaml`,
    `https://openapi.kevel.co/creative-template.yaml`,
  ]);
});

test('buildPartialSpecificationList returns a github url if only version specified', () => {
  let sl = buildPartialSpecificationList({
    objects: ['ad', 'creative-template'],
    version: 'v1.0.1',
  });
  expect(sl).toStrictEqual([
    `https://openapi.kevel.co/v1.0.1/ad.yaml`,
    `https://openapi.kevel.co/v1.0.1/creative-template.yaml`,
  ]);
});

test('buildPartialSpecificationList returns the base path and ignores version if base path specified', () => {
  let sl = buildPartialSpecificationList({
    objects: ['ad', 'creative-template'],
    basePath: '../test/fixtures',
  });
  expect(sl).toStrictEqual([
    '../test/fixtures/ad.yaml',
    '../test/fixtures/creative-template.yaml',
  ]);
});

test('parseSpecifications properly parses and transforms an OpenAPI v3 spec', async () => {
  let specifications = await fetchSpecifications(['./test/fixtures/petstore.json']);

  let [contract, securitySchemes] = await parseSpecifications(specifications);

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
