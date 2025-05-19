import { Dict } from '@leyyo/common';
import { CastApiDocResponse } from '../pool';
import { CastPointer } from '../basic';
import {CastTokenized} from "../tokenizer";

export type CastGenericsLambda<T = any> = (children: Array<CastPointer>, value: unknown) => T;
// noinspection JSUnusedGlobalSymbols
export type CastGenericsIsLambda = (children: Array<CastPointer>, value: unknown) => boolean;
export type CastGenericsDocLambda = (
    children: Array<CastPointer>, // child
    target: unknown,
    propertyKey: PropertyKey,
    openApi: Dict,
) => CastApiDocResponse;

export interface CastGenericsLike {
    buildPointer(tokenized: CastTokenized): CastPointer;
}
