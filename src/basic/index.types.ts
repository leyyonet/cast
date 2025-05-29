import { ClassLike } from '@leyyo/common';
import { CastBase, CastDocLambda, CastIsLambda, CastLambda, CastTag } from '../pool';
import { CastGenericsDocLambda, CastGenericsLambda } from '../generics';
import { CastTokenized } from '../tokenizer';
import { DiscriminatorOpt } from '../decorators';
import { FqnNaming } from '../../../core';

export interface CastValue {
    clazz: CastClass;
    tokenized: CastTokenized;
    generics?: CastExtensionGenerics;
    tags?: Array<CastTag>;
    naming?: FqnNaming;
    discriminator?: DiscriminatorOpt;
}

export interface CastExtensionGenerics {
    min: number;
    max: number;
}

export interface CastClass extends ClassLike {
    priority?: CastPriority;

    is?: CastIsLambda;
    cast?: CastLambda;
    doc?: CastDocLambda;

    castGen?: CastGenericsLambda; // generics
    docGen?: CastGenericsDocLambda; // generics
}

export type CastPriorityLambda = (value: any) => boolean;
export type CastPriorityLevel = 1 | 2 | 3 | 4 | 5 | 99; // min, high, mid, low, min, else
export type CastBasicType = 'string' | 'number' | 'boolean' | 'bigint' | 'object' | 'array' | 'any';

export interface CastPriority extends CastBasicProp<CastPriorityLevel> {
    is?: CastPriorityLambda;
    instance?: Array<[ClassLike, CastPriorityLevel]>;
}

export type CastBasicProp<T> = {
    [key in CastBasicType]?: T;
};

export interface CastBasicLike {
    build(tokenized: CastTokenized): CastBase;
}
