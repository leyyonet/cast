import { ClassReflectionLike } from '@leyyo/core';
import { CastBase, CastTag, CastTokenized } from '../shared';
import { AssignTupleOpt } from '../decorators';

export interface CastTupleLike {
    fetch(classRef: ClassReflectionLike, opt: AssignTupleOpt): void;

    process(classRef: ClassReflectionLike): void;

    build(tokenized: CastTokenized): CastBase;
}
