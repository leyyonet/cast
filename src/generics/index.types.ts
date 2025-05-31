import { CastBase, CastTag, CastTokenized } from '../shared';
import { AssignGenericsOpt, GenericsIndexOpt } from '../decorators';
import { ClassReflectionLike, PropertyReflectionLike } from '@leyyo/core';

export interface CastGenericsLike {
    addIndex(fieldRef: PropertyReflectionLike, opt: GenericsIndexOpt): void;
    processIndex(fieldRef: PropertyReflectionLike): void;

    fetch(classRef: ClassReflectionLike, opt: AssignGenericsOpt): void;

    process(classRef: ClassReflectionLike): void;

    build(tokenized: CastTokenized): CastBase;
}
