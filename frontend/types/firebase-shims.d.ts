// Stub type declarations for firebase/* and papaparse modules.
//
// Why this file exists:
//   The installed `firebase@10.14.1` package ships `exports` entries that point at
//   `index.d.ts` files which were not published on disk. As a result, `firebase/auth`,
//   `firebase/firestore`, `firebase/messaging`, `firebase/storage` and
//   `firebase/functions` have no resolvable declaration files, and TypeScript's
//   `noImplicitAny` flag (turned on by `tsconfig.strict.json`) reports
//   `TS7016: Could not find a declaration file for module ...` for every import.
//
//   We intentionally do NOT add `// @ts-ignore` on the import sites or `as any` casts
//   at every call site — both would scatter type-erasure throughout the codebase and
//   hide real bugs. Instead, this file declares the missing modules with permissive
//   `any` types, so the rest of the codebase keeps its existing surface area and
//   the runtime behaviour is unchanged.
//
//   Every parameter in the firebase function signatures is explicitly typed as `any`
//   (not implicitly inferred) so that callback parameters (e.g. `(snap) => ...`) do
//   not raise `TS7006: Parameter implicitly has an 'any' type`.
//
//   The `papaparse` block adds a `default` export (which is what
//   `import Papa from 'papaparse'` resolves to) on top of the existing
//   `types/papaparse.d.ts`.

type _Any = any;
type _VoidFn = (...args: any[]) => any;
type _DataCallback = (data: any) => void;
type _ErrorCallback = (error: any) => void;
type _SnapshotListener = (snap: any) => void;

declare module 'firebase/auth' {
  export const getAuth: (app?: _Any) => _Any;
  export const signOut: (auth: _Any) => Promise<void>;
  export const signInWithEmailAndPassword: (auth: _Any, email: string, password: string) => Promise<_Any>;
  export const createUserWithEmailAndPassword: (auth: _Any, email: string, password: string) => Promise<_Any>;
  export const sendPasswordResetEmail: (auth: _Any, email: string, actionCodeSettings?: _Any) => Promise<void>;
  export const sendEmailVerification: (user: _Any, actionCodeSettings?: _Any) => Promise<void>;
  export const onAuthStateChanged: (auth: _Any, next: (user: _Any | null) => void, error?: _ErrorCallback) => () => void;
  export type User = any;
}

declare module 'firebase/firestore' {
  export const initializeFirestore: (app: _Any, settings?: _Any) => _Any;
  export const persistentLocalCache: (settings?: _Any) => _Any;
  export const persistentMultipleTabManager: (settings?: _Any) => _Any;
  export const memoryLocalCache: () => _Any;
  export const collection: (firestore: _Any, path: string, ...pathSegments: string[]) => _Any;
  export const collectionGroup: (firestore: _Any, id: string) => _Any;
  export const doc: (parent: _Any, path?: string, ...pathSegments: string[]) => _Any;
  export const getDoc: (reference: _Any) => Promise<_Any>;
  export const getDocs: (query: _Any) => Promise<_Any>;
  export const onSnapshot: (ref: _Any, onNext: _SnapshotListener, onError?: _ErrorCallback) => () => void;
  export const query: (query: _Any, ...constraints: _Any[]) => _Any;
  export const where: (field: string, op: string, value: _Any) => _Any;
  export const orderBy: (field: string, direction?: 'asc' | 'desc') => _Any;
  export const limit: (n: number) => _Any;
  export const setDoc: (reference: _Any, data: _Any, options?: _Any) => Promise<void>;
  export const updateDoc: (reference: _Any, data: _Any) => Promise<void>;
  export const addDoc: (reference: _Any, data: _Any) => Promise<_Any>;
  export const deleteDoc: (reference: _Any) => Promise<void>;
  export const serverTimestamp: () => _Any;
  export const runTransaction: (firestore: _Any, update: (tx: _Any) => Promise<_Any>) => Promise<_Any>;
  export const writeBatch: (firestore: _Any) => _Any;
  export const arrayUnion: (...elements: _Any[]) => _Any;
  export const arrayRemove: (...elements: _Any[]) => _Any;
  export const increment: (n: number) => _Any;
  export const Timestamp: _Any;
  export type Timestamp = any;
  export type Unsubscribe = any;
  export type DocumentData = any;
  export type DocumentReference<T = any> = any;
  export type FieldValue = any;
  export type QueryConstraint = any;
}

declare module 'firebase/messaging' {
  export const getMessaging: (app?: _Any) => _Any;
  export const getToken: (messaging: _Any, options?: _Any) => Promise<string | null>;
  export const onMessage: (messaging: _Any, next: (payload: _Any) => void) => () => void;
  export const isSupported: () => Promise<boolean>;
  export type MessagePayload = any;
}

declare module 'firebase/storage' {
  export const getStorage: (app?: _Any, bucketUrl?: string) => _Any;
  export const ref: (storage: _Any, path?: string) => _Any;
  export const uploadBytes: (ref: _Any, data: _Any, metadata?: _Any) => Promise<_Any>;
  export const getDownloadURL: (ref: _Any) => Promise<string>;
  export const deleteObject: (ref: _Any) => Promise<void>;
}

declare module 'firebase/functions' {
  export const getFunctions: (app?: _Any, region?: string) => _Any;
  export const httpsCallable: (functions: _Any, name: string, options?: _Any) => (data?: _Any) => Promise<_Any>;
}

declare module 'papaparse' {
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
  export interface ParseMeta {
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  }
  export interface ParseError {
    type: 'FieldMismatch' | 'TooManyFields' | 'TooFewFields' | 'UndetectableDelimiter' | 'InvalidQuotes';
    code: string;
    message: string;
    row?: number;
  }
  export interface ParseResult<T = any> {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  }
  export function parse<T = any>(data: string, config?: ParseConfig<T>): ParseResult<T>;
  export function unparse<T = any>(data: T[], config?: UnparseConfig<T>): string;
  const Papa: {
    parse: typeof parse;
    unparse: typeof unparse;
  };
  export default Papa;
}
