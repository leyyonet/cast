import { CastBase, CastDocCallback, CastDocResponse } from '../pool';
import { CastClass } from '../basic';
import { CastTokenized } from '../tokenizer';

export type CastGenericsLambda<T = any> = (children: Array<CastClass>, value: unknown) => T;
// noinspection JSUnusedGlobalSymbols
export type CastGenericsIsLambda = (children: Array<CastClass>, value: unknown) => boolean;
export type CastGenericsDocLambda = (children: Array<CastClass>, openApi: CastDocCallback) => CastDocResponse;

export interface CastGenericsLike {
    build(tokenized: CastTokenized): CastBase;
}
