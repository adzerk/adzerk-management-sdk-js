import camelcase from 'camelcase';
import isValid from 'date-fns/isValid';
import parseISO from 'date-fns/parseISO';
import { Validator } from 'strickland';

import { ValidatorFactory, wrapNullable } from './';
import { isStream } from '../utils';

const factory: ValidatorFactory = (schema, propertyName) => {
  let camelCasePropertyName = camelcase(propertyName);
  let wn = wrapNullable.bind(null, schema, camelCasePropertyName);
  let validators: Array<Validator> = [];

  if (schema.hasOwnProperty('format')) {
    if (schema.format === 'binary') {
      validators.push(
        wn(
          (v) =>
            Buffer.isBuffer(v) ||
            isStream(v) || {
              isValid: false,
              message: `${camelCasePropertyName} must be a string or Buffer`,
            }
        )
      );
    } else if (schema.format === 'date' || schema.format === 'date-time') {
      validators.push((v) => {
        if (!!schema.nullable && v == undefined) {
          return true;
        }
        let m = '';
        let d = typeof v === 'string' ? parseISO(v) : v;

        try {
          if (isValid(d)) {
            return true;
          }
          m = `${camelCasePropertyName} must be a valid Date`;
        } catch {}

        return { isValid: false, message: m };
      });
    }
  } else {
    validators.push(
      wn(
        (v) =>
          typeof v === 'string' || {
            isValid: false,
            message: `${camelCasePropertyName} must be a string`,
          }
      )
    );
  }

  if (schema.hasOwnProperty('minLength')) {
    validators.push(
      wn(
        (v) =>
          (schema.minLength != undefined && v.length >= schema.minLength) || {
            isValid: false,
            message: `${camelCasePropertyName} has a minimum length of ${schema.minLength}`,
          }
      )
    );
  }

  if (schema.hasOwnProperty('maxLength')) {
    validators.push(
      wn(
        (v) =>
          (schema.maxLength != undefined && v.length <= schema.maxLength) || {
            isValid: false,
            message: `${camelCasePropertyName} has a maximum length of ${schema.maxLength}`,
          }
      )
    );
  }

  if (schema.hasOwnProperty('pattern')) {
    let re = new RegExp(schema.pattern || '');
    validators.push(
      wn((v) => re.test(v)) || {
        isValid: false,
        message: `${camelCasePropertyName} must match the pattern ${schema.pattern}`,
      }
    );
  }

  if (schema.hasOwnProperty('enum')) {
    validators.push(
      wn(
        (v) =>
          (schema.enum != undefined && schema.enum.includes(v)) || {
            isValid: false,
            message: `${camelCasePropertyName} must be one of the following: ${(
              schema.enum || []
            ).join(', ')}`,
          }
      )
    );
  }

  return validators;
};

export default factory;
