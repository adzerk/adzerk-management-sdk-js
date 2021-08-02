# Adzerk JavaScript/Typescript Management SDK

JavaScript Software Development Kit for Adzerk Management APIs.

## Installation

[NPM Package](https://www.npmjs.com/package/@adzerk/management-sdk)

```shell
npm install @adzerk/management-sdk
```

or

```shell
yarn add @adzerk/management-sdk
```

## How It Works

Adzerk's Management SDK takes a data-driven approach to working with our API. This means that all of our operations are driven by OpenAPI documentation found at https://github.com/adzerk/adzerk-api-specification. This means that the SDK Client Factory takes a list of specifications during construction. There are several utility methods for building that specification list, the easiest of which is `buildFullSpecificationList`. You then pass that list to `fetchSpecifications` to load and parse the documents:

```js
let Adzerk = require("@adzerk/management-sdk");
let specificationList = Adzerk.buildFullSpecificationList();
let specifications = await Adzerk.fetchSpecifications(specificationList);
let client = await Adzerk.buildClient({ apiKey: "*****", specifications });
```

We also provide the ability to pin to a specific version of the OpenAPI documents as well. This allows a stable set of functionality but may prevent usage of the latest and greatest features. If you want to take advantage of this, you can use the `buildFullSpecificationList` helper method:

```js
let Adzerk = require("@adzerk/management-sdk");
let specificationList = Adzerk.buildFullSpecificationList({
  version: "v1.0.1",
});
let specifications = await Adzerk.fetchSpecifications(specificationList);
let client = await Adzerk.buildClient({ apiKey: "*****", specifications });
```

This will still download and parse the specifications at runtime. We also provide the ability to load the OpenAPI documents from disk. This will save some time and allow you pin to a specific revision (or allow you to patch them yourselves):

```js
let Adzerk = require("@adzerk/management-sdk");
let specificationList = Adzerk.buildFullSpecificationList({
  basePath: "../path/to/repo ",
});
let specifications = await Adzerk.fetchSpecifications(specificationList);
let client = await Adzerk.buildClient({ apiKey: "*****", specifications });
```

We also provide the ability to specify only the API objects you are interested in. By using this, you'll gain another performance boost as only a handful of documents will be parsed instead of the full set. This method also supports pinning to versions or loading from disk:

```js
let Adzerk = require("@adzerk/management-sdk");
let specificationList = Adzerk.buildPartialSpecificationList({
  version: "v1.0.1",
  objects: ["campaign", "flight", "ad"],
});
let specifications = await Adzerk.fetchSpecifications(specificationList);
let client = await Adzerk.buildClient({ apiKey: "*****", specifications });
```

## Object, Operation, Parameters Pattern

There is really only one method you will call on the SDK, and that is the `client.run` method. However, it takes at a minimum an object name (like `advertiser`) and a `camelCased` operation name (like `create`, `list`, or `listForCampaign`). Some operations also take a JavaScript object of parameters.

## Logging

Our logging implementation is meant to be flexible enough to fit into any common NodeJS logging framework.

When constructing a client instance, the logger is passed in as an anonymous function with three parameters:

`level`: Any one of `debug`, `info`, `warn`, or `error`.

`message`: The message to log.

`metadata`: Any additional metadata related to the logging call.

If no `logger` is provided as an argument, the default implementation will be used and write to `stdout`.

The easiest way to integrate is to write a function that handles translating the data from the Adzerk SDK Logger into whatever logging framework you're using in the rest of your application:

```js
const Adzerk = require("@adzerk/management-sdk");

const logger = (level, message, metadata) => {
  console.log(`(${level}) ${message} - ${JSON.stringify(metadata)}`);
};

let client = await Adzerk.buildClient({ logger });
```

## Acquiring API Credentials

Go to [API Keys page](https://app.adzerk.com/#!/api-keys/) find active API keys.
