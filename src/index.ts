export interface LoggerFunc {
  (lvl: string, msg: string, meta?: object): void;
}

export { buildFullSpecificationList, buildPartialSpecificationList } from './specParser';

export { buildClient } from './clientFactory';
