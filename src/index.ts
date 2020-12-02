export interface LoggerFunc {
  (lvl: 'debug' | 'info' | 'warn' | 'error', msg: string, meta?: object): void;
}

export enum DistributionType {}

export enum GoalType {}

export enum RateType {}

export enum CapType {}

export enum FequencyCapType {}

export enum CreativeTemplateFieldType {}

export enum CreativeTemplateContentType {}

export enum CreativeTemplateOperation {}

export enum DayOfTheWeek {}

export enum DupliateMode {}

export enum DeliveryStatus {}

export enum SelectionAlgorithm {}

export enum ScchedulingWindow {}

export enum RecurrenceType {}

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
