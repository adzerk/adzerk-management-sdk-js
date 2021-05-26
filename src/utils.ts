import camelcase from 'camelcase';
import { isValid, parseISO } from 'date-fns';

export const isObject = (obj: any) =>
  typeof obj === 'object' &&
  obj !== null &&
  !(obj instanceof RegExp) &&
  !(obj instanceof Error) &&
  !(obj instanceof Date);

export const convertKeysToCamelcase = (obj: any): any => {
  if (!isObject(obj)) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((o) => convertKeysToCamelcase(o));
  }

  return Object.keys(obj).reduce(
    (agg, k) => (
      (agg[/[a-zA-Z]/g.test(k) ? camelcase(k) : k] = convertKeysToCamelcase(obj[k])), agg
    ),
    {} as any
  );
};

export const isStream = (obj: any) =>
  typeof obj === 'object' && typeof obj.pipe === 'function';
