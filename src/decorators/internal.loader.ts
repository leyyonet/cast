import { AssignGenerics } from './assign-generics';
import { AssignTuple } from './assign-tuple';
import { AssignType } from './assign-type';
import { AssignUnion } from './assign-union';
import { Cast } from './cast';
import { GenericsIndex } from './generics-index';
import { AssignDto } from './assign-dto';
import { CastAlias } from './cast-alias';

export const $$castDecorators = [
    AssignGenerics,
    AssignTuple,
    AssignType,
    AssignUnion,
    AssignDto,
    Cast,
    CastAlias,
    GenericsIndex,
];
