import { EnumLiteral, EnumMap } from '../../../common';
import { ClassLike } from '@leyyo/common';
import { CastBase } from '../pool';

export interface CastEnumLike {
    canBe(clazz: CastEnumName): boolean;

    build(clazz: CastEnumName): CastBase;
}

export type CastEnumName = string | ClassLike | EnumLiteral | EnumMap;
