export interface LoggerFunc {
  (lvl: 'debug' | 'info' | 'warn' | 'error', msg: string, meta?: object): void;
}

export {
  buildFullSpecificationList,
  buildPartialSpecificationList,
  fetchSpecifications,
} from './specParser';

export { buildClient } from './clientFactory';
