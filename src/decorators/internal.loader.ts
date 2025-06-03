import { CastGenerics } from './cast-generics';
import { CastTuple } from './cast-tuple';
import { CastBasic } from './cast-basic';
import { CastUnion } from './cast-union';
import { Cast } from './cast';
import { CastIndex } from './cast-index';
import { CastDto } from './cast-dto';
import { CastAlias } from './cast-alias';
import { CastMerge } from './cast-merge';
import {CastType} from "./cast-type";

export const $$castDecorators = [
    CastDto,
    CastGenerics,
    CastMerge,

    CastTuple,
    CastBasic,
    CastUnion,
    Cast,
    CastType,
    CastAlias,
    CastIndex,
];
