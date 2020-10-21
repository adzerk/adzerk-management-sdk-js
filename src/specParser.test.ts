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
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/advertiser.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/creative-template.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/creative.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/flight.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/ad.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/ad-type.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/campaign.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/channel.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/channel-site-map.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/flight-category.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/geo-targeting.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/priority.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/site-zone-targeting.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/site.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/zone.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/queued-report.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/scheduled-report.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/real-time-report.yaml`,
  ]);
});

test('buildFullSpecificationList returns a github url if only version specified', () => {
  let sl = buildFullSpecificationList('v1.0.1');
  expect(sl).toStrictEqual([
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/advertiser.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/creative-template.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/creative.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/flight.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/ad.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/ad-type.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/campaign.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/channel.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/channel-site-map.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/flight-category.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/geo-targeting.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/priority.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/site-zone-targeting.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/site.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/zone.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/queued-report.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/scheduled-report.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/real-time-report.yaml`,
  ]);
});

test('buildFullSpecificationList returns the base path and ignores version if base path specified', () => {
  let sl = buildFullSpecificationList(undefined, '../test/fixtures');
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
    '../test/fixtures/flight-category.yaml',
    '../test/fixtures/geo-targeting.yaml',
    '../test/fixtures/priority.yaml',
    '../test/fixtures/site-zone-targeting.yaml',
    '../test/fixtures/site.yaml',
    '../test/fixtures/zone.yaml',
    '../test/fixtures/queued-report.yaml',
    '../test/fixtures/scheduled-report.yaml',
    '../test/fixtures/real-time-report.yaml',
  ]);
});

test('buildPartialSpecificationList returns a master github url if no options specified', () => {
  let sl = buildPartialSpecificationList(['ad', 'creative-template']);
  expect(sl).toStrictEqual([
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/ad.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/master/management/creative-template.yaml`,
  ]);
});

test('buildPartialSpecificationList returns a github url if only version specified', () => {
  let sl = buildPartialSpecificationList(['ad', 'creative-template'], 'v1.0.1');
  expect(sl).toStrictEqual([
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/ad.yaml`,
    `https://raw.githubusercontent.com/adzerk/adzerk-api-specification/v1.0.1/management/creative-template.yaml`,
  ]);
});

test('buildPartialSpecificationList returns the base path and ignores version if base path specified', () => {
  let sl = buildPartialSpecificationList(
    ['ad', 'creative-template'],
    undefined,
    '../test/fixtures'
  );
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
