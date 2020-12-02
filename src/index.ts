export interface LoggerFunc {
  (lvl: 'debug' | 'info' | 'warn' | 'error', msg: string, meta?: object): void;
}

export enum DistributionType {
  AutoBalanced = 1,
  Percentage = 2,
  FixedImpressions = 3,
}

export enum GoalType {
  Impressions = 1,
  Percentage = 2,
  Click = 3,
  Any = 7,
  LifetimeRevenue = 8,
  DailyRevenue = 9,
}

export enum RateType {
  Flat = 1,
  Cpm = 2,
  Cpc = 3,
  CpaView = 4,
  CpaClick = 5,
}

export enum CapType {
  Impressions = 1,
  Clicks = 2,
  Conversions = 3,
  Revenue = 4,
}

export enum FequencyCapType {
  Hour = 1,
  Day = 2,
  Minute = 3,
}

export enum CreativeTemplateFieldType {
  String = 'String',
  File = 'File',
  ExternalFile = 'ExternalFile',
  Array = 'Array',
  Number = 'Number',
}

export enum CreativeTemplateContentType {
  Html = 'HTML',
  JavaScript = 'JavaScript',
  JavaScriptExternal = 'JavaScriptExternal',
  Css = 'CSS',
  Raw = 'Raw',
}

export enum CreativeTemplateOperation {
  Update = 'Update',
  Delete = 'Delete',
  InsertAfter = 'InsertAfter',
}

export enum DayOfTheWeek {
  Sunday = 'SU',
  Monday = 'MO',
  Tuesday = 'TU',
  Wednesday = 'WE',
  Thursday = 'TH',
  Friday = 'FR',
  Saturday = 'SA',
}

export enum DuplicateMode {
  Flight = 1,
  Campaign = 2,
  Advertiser = 3,
  Creative = 4,
}

export enum DeliveryStatus {
  Pending = 0,
  Healthy = 1,
  BorderLine = 2,
  InDanger = 3,
  Finished = 4,
  Undelivered = 5,
}

export enum SelectionAlgorithm {
  Lottery = 0,
  Auction = 1,
  AdchainOrdered = 2,
  AdchainOptimized = 3,
  LotteryWithOutbid = 4,
}

export enum ScchedulingWindow {
  EarlyMorning = 0,
  Morning = 1,
  Afternoon = 2,
  Evening = 3,
}

export enum RecurrenceType {
  None = 0,
  Daily = 1,
  Weekly = 2,
  Monthly = 3,
}

import {
  buildFullSpecificationList,
  buildPartialSpecificationList,
  fetchSpecifications,
} from './specParser';

import { buildClient } from './clientFactory';

export {
  buildClient,
  buildFullSpecificationList,
  buildPartialSpecificationList,
  fetchSpecifications,
};
