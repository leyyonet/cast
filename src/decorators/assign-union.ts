import { decoratorPool } from '@leyyo/core';
import { FQN } from '../internal';
import { $assert, $dev } from '@leyyo/common';
import { CastNamePlain } from '../pool';

export interface AssignUnionOpt {
    types: Array<CastNamePlain>;
}

export function AssignUnion(...types: Array<CastNamePlain>): ClassDecorator {
    return (clazz) => deco.process([clazz], { types });
}

const deco = decoratorPool
    .newId<AssignUnionOpt>(AssignUnion)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple', 'no-inherited')
    .processor((ins, p) => {
        if (Array.isArray(p.types) && p.types.length < 1) {
            delete p.types;
        }
        $assert.array(p.types, () => $dev.desc(ins, { field: 'types' }));
        ins.set(p);
    });
// castPool.type.addType(like, 'union');
// const clazz = ins.asClass.creator;
// let like = clazz as unknown as TypeLike;
// castPool.union.addCache(castPool.generics.parse(p.types.join('|')), like)
// switch (castPool.analyse(like)) {
//     case 'type-static':
//         break;
//     case 'type-instance':
//         like = (clazz).prototype as TypeLike;
//         break;
//     default:
//         throw $dev.invalidError({issue: 'union.invalid-function', desc: ins.description});
// }
