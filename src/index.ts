export interface LoggerFunc {
  (lvl: string, msg: string, meta: object): void;
}

export {
  buildSpecificationList,
  fetchSpecifications,
  parseSpecifications,
} from "./specParser";
