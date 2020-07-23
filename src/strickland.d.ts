declare module "strickland" {
  export type ComplexValidationResult = {
    [key: string]: any;
    isValid: boolean;
  };

  export type ValidationResult = boolean | ComplexValidationResult;

  export interface Validator {
    (value?: any): ValidationResult;
  }

  export default function validate(validator: any, item: any): any;

  export function every(validators: Array<Validator>): Validator;

  export function form(obj: {
    [key: string]: Validator | Array<Validator>;
  }): Validator;
}
