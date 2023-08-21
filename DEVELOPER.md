# Developer Notes

## Summary

This file is used to communicate important notes to developers.

## Package Updates

This project targets CommonJS NodeJS Javascript as shown in the `module` type specified in the [tsconfig.json](./tsconfig.json). This means that we cannot target PURELY ESM `npm` packages, which are becoming increasingly more common. This project includes packages where later versions have migrated to pure ESM, meaning we need to be careful when updating packages. These include:

- `camelcase` (from `v7.0.0`, [see here](https://github.com/sindresorhus/camelcase/releases/tag/v7.0.0)).
- `map-obj` (from `v5.0.0`, [see here](https://github.com/sindresorhus/map-obj/releases/tag/v5.0.0)).
- `node-fetch` (from `v3.0.0`, [see here](https://github.com/node-fetch/node-fetch/releases/tag/v3.0.0))
