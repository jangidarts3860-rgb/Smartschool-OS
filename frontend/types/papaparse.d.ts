declare module 'papaparse' {
  export function parse<T = any>(data: string, config?: ParseConfig<T>): ParseResult<T>;
  export function unparse<T = any>(data: T[], config?: UnparseConfig<T>): string;
  
  export interface ParseConfig<T = any> {
    header?: boolean;
    skipEmptyLines?: boolean | 'greedy';
    delimiter?: string;
    complete?: (results: ParseResult<T>) => void;
    error?: (err: ParseError) => void;
  }
  
  export interface UnparseConfig<T = any> {
    quotes?: boolean;
    delimiter?: string;
    header?: boolean;
  }
  
  export interface ParseResult<T = any> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }
  
  export interface ParseError {
    type: 'FieldMismatch' | 'TooManyFields' | 'TooFewFields' | 'UndetectableDelimiter' | 'InvalidQuotes';
    code: string;
    message: string;
    row?: number;
  }
  
  export interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  }
}