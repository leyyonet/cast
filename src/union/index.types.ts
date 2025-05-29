import { ClassLike } from '@leyyo/common';
import { CastBasicProp, CastClass, CastPriority, CastPriorityLambda, CastPriorityLevel } from '../basic';
import { CastTokenized } from '../tokenizer';
import { CastBase } from '../pool';
import { DiscriminatorOpt } from '../decorators';

export interface CastUnionLike {
    build(tokenized: CastTokenized): CastBase;
}

export interface CastUnionConfig extends CastBasicProp<[CastClass, CastPriorityLevel]> {
    is: Array<[CastClass, CastPriorityLambda]>;

    instance: Array<[ClassLike, CastClass]>;
    discriminators: Array<[CastClass, DiscriminatorOpt]>;
    tempLevels: CastUnionLevel;
    newPriority: CastPriority;
    expectedTypes: Array<string>;
}

export type CastUnionLevel = CastBasicProp<Map<CastPriorityLevel, Array<CastClass>>>;
