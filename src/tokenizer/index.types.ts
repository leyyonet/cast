import { CastKind, CastNamePlain } from '../pool';
import { CastClass } from '../basic';

export interface CastTokenizerLike {
    saveSign(clazz: CastClass, tokenized: CastTokenized): void;

    getSign(clazz: CastClass): CastTokenized;

    tokenize(text: string): CastTokenized;

    clearKinds(tokenized: CastTokenized): void;

    className(clazz: CastNamePlain): string;

    parse(clazz: CastNamePlain, check?: boolean): CastTokenized;

    parseCleared(clazz: CastNamePlain, check?: boolean): CastTokenized;

    stringify(tokenized: CastTokenized): string;
}

export interface CastToken {
    type: CastTokenType;
    value?: string;
}

export type CastTokenType =
    | 'comma'
    | 'pipe'
    | 'value'
    | 'generics-begin'
    | 'generics-end'
    | 'tuple-begin'
    | 'tuple-end'
    | 'ignore';

export interface CastTokenized {
    base?: string;
    kind?: CastKind;
    children?: Array<CastTokenized>;
}

export interface CastTokenizedInside extends CastTokenized {
    parent?: CastTokenizedInside;
    children?: Array<CastTokenizedInside>;
}
