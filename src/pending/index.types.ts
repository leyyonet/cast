import { CastBase } from '../pool';
import { CastTokenized } from '../tokenizer';

export interface CastPendingLike {
    queue(tokenized: CastTokenized, fn: CastPendingLambda): void;

    complete(tokenized: CastTokenized): void;

    has(tokenized: CastTokenized): boolean;

    list(): Array<CastTokenized>;
}

export type CastPendingLambda = (v) => CastBase;
