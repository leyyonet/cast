import { CastBase, CastEnumName } from '../shared';

export interface CastEnumLike {
    canBe(clazz: CastEnumName): boolean;

    build(clazz: CastEnumName): CastBase;
}
