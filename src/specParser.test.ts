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
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/advertiser.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/creative-template.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/creative.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/flight.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/ad.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/ad-type.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/campaign.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/channel.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/channel-site-map.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/flight-category.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/geo-targeting.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/priority.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/site-zone-targeting.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/site.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/zone.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/queued-report.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/scheduled-report.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/real-time-report.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/day-part.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/user.yaml`,
  ]);
});

test('buildFullSpecificationList returns a github url if only version specified', () => {
  let sl = buildFullSpecificationList({ version: 'v1.0.1' });
  expect(sl).toStrictEqual([
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/advertiser.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/creative-template.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/creative.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/flight.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/ad.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/ad-type.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/campaign.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/channel.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/channel-site-map.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/flight-category.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/geo-targeting.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/priority.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/site-zone-targeting.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/site.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/zone.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/queued-report.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/scheduled-report.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/real-time-report.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/day-part.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/user.yaml`,
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
  ]);
});

test('buildPartialSpecificationList returns a master github url if no options specified', () => {
  let sl = buildPartialSpecificationList({ objects: ['ad', 'creative-template'] });
  expect(sl).toStrictEqual([
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/ad.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/creative-template.yaml`,
  ]);
});

test('buildPartialSpecificationList returns a github url if only version specified', () => {
  let sl = buildPartialSpecificationList({
    objects: ['ad', 'creative-template'],
    version: 'v1.0.1',
  });
  expect(sl).toStrictEqual([
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/ad.yaml`,
    `http://developer-exp-management-api-specification.s3-website-us-east-1.amazonaws.com/v1.0.1/creative-template.yaml`,
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
