import 'jest';
import { Writable } from 'stream';

import { isObject, convertKeysToCamelcase, isStream } from './utils';

test('isObject returns true if given an object', () => {
  expect(isObject({})).toBe(true);
});

test('isOjbect returns false if given a primitive', () => {
  expect(isObject(1)).toBe(false);
  expect(isObject('test')).toBe(false);
  expect(isObject(BigInt(1))).toBe(false);
  expect(isObject(undefined)).toBe(false);
  expect(isObject(true)).toBe(false);
  expect(isObject(Symbol('test'))).toBe(false);
});

test('isObject returns false if given a Date', () => {
  expect(isObject(new Date(Date()))).toBe(false);
});

test('isObject returns false if given a RegExp', () => {
  expect(isObject(/^abc/g)).toBe(false);
});

test('isObject returns false if given an Error', () => {
  expect(isObject(new Error())).toBe(false);
});

test('convertKeysToCamelcase properly converts object keys', () => {
  let o = {
    Hello: 'World',
    Foo_Bar: 'Baz',
  };

  expect(convertKeysToCamelcase(o)).toStrictEqual({
    hello: 'World',
    fooBar: 'Baz',
  });
});

test('convertKeysToCamelcase properly converts arrays of objects', () => {
  let o = [{ Hello: 'World' }, { Foo_Bar: 'Baz' }];
  expect(convertKeysToCamelcase(o)).toStrictEqual([
    { hello: 'World' },
    { fooBar: 'Baz' },
  ]);
});

test('convertKeysToCamelcase does not mangle primitives', () => {
  expect(convertKeysToCamelcase(1)).toBe(1);
  expect(convertKeysToCamelcase('test')).toBe('test');
  expect(convertKeysToCamelcase(BigInt(1))).toBe(BigInt(1));
  expect(convertKeysToCamelcase(undefined)).toBe(undefined);
  expect(convertKeysToCamelcase(true)).toBe(true);
  expect(convertKeysToCamelcase(Symbol.for('test'))).toBe(Symbol.for('test'));
});

test('isStream returns true if provided an object that supports pipe', () => {
  expect(isStream(new Writable())).toBe(true);
  expect(
    isStream({
      pipe: () => {},
    })
  ).toBe(true);
});

test('isStream returns false if provided an object without pipe-ability', () => {
  expect(isStream({})).toBe(false);
  expect(isStream(1)).toBe(false);
});
