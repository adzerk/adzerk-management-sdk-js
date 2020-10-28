export interface LoggerFunc {
  (lvl: 'debug' | 'info' | 'warn' | 'error', msg: string, meta?: object): void;
}

import {
  buildFullSpecificationList,
  buildPartialSpecificationList,
  fetchSpecifications,
} from './specParser';

import { buildClient } from './clientFactory';

export default {
  buildClient,
  buildFullSpecificationList,
  buildPartialSpecificationList,
  fetchSpecifications,
};
