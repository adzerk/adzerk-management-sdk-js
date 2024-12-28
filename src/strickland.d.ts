declare module 'strickland-esm' {
  export type FormValidationResult = {
    isComplete: boolean;
    validationResults?: any;
    validationErrors?: any;
  };

  export type ComplexValidationResult = {
    [key: string]: any;
    isValid: boolean;
    value?: any;
    form?: FormValidationResult;
  };

  export type ValidationResult = boolean | ComplexValidationResult;

  export interface Validator {
    (value?: any): ValidationResult;
  }

  export default function validate(
    validator: Validator | Array<Validator>,
    item: any
  ): ValidationResult;

  export function every(validators: Array<Validator>): Validator;

  export function form(obj: {
    [key: string]: Validator | Array<Validator>;
  }): Validator;
}
