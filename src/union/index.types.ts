import { ClassReflectionLike } from '@leyyo/core';
import { ClassLike } from '@leyyo/common';
import {
    CastBase,
    CastBasicProp,
    CastClass,
    CastIsLambda,
    CastPriority,
    CastPriorityLevel,
    CastTag,
    CastTokenized,
    CastUnionLevel,
} from '../shared';
import { AssignDtoOpt, AssignUnionOpt } from '../decorators';

export interface CastUnionLike {
    fetch(classRef: ClassReflectionLike, opt: AssignUnionOpt): void;

    process(classRef: ClassReflectionLike): void;

    build(tokenized: CastTokenized): CastBase;
}

export interface CastUnionConfig extends CastBasicProp<[CastClass, CastPriorityLevel]> {
    exact: Array<[CastClass, CastIsLambda]>;

    instance: Array<[ClassLike, CastClass]>;
    discriminators: Array<[CastClass, AssignDtoOpt]>;
    tempLevels: CastUnionLevel;
    newPriority: CastPriority;
    expectedTypes: Array<string>;
}
