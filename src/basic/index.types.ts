import { ClassLike, Func } from '@leyyo/common';
import { CastDocLambda, CastIsLambda, CastLambda } from '../pool';
import { CastGenericsLambda, CastGenericsDocLambda } from '../generics';
import {CastTokenized} from "../tokenizer";


export interface CastExtension {
    tokenized: CastTokenized;
    hash: string;
    names: Array<string>;
    gen?: CastExtensionGenerics;
}
export interface CastExtensionGenerics {
    min: number;
    max: number;
}

export interface CastPointer extends ClassLike {
    priority?: CastPriority;

    is?: CastIsLambda;
    cast?: CastLambda;
    doc?: CastDocLambda;

    castGen?: CastGenericsLambda; // generics
    docGen?: CastGenericsDocLambda; // generics
}

export type CastPriorityLambda = (value: any) => boolean;
export type CastPriorityLevel = 1 | 2 | 3 | 4 | 5 | 99; // min, high, mid, low, min, else
export interface CastPriority {
    is?: CastPriorityLambda;
    string?: CastPriorityLevel;
    number?: CastPriorityLevel;
    boolean?: CastPriorityLevel;
    bigint?: CastPriorityLevel;
    object?: CastPriorityLevel;
    array?: CastPriorityLevel;
    any?: CastPriorityLevel;
    instance?: Array<[ClassLike | string | Func, CastPriorityLevel]>;
}

export interface CastBasicLike {
    buildPointer(tokenized: CastTokenized): CastPointer;
}
