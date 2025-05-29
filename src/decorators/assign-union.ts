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
    .rules('no-multiple', 'no-inherited', 'no-copy')
    .processor((ins, p) => {
        if (Array.isArray(p.types) && p.types.length < 1) {
            delete p.types;
        }
        $assert.array(p.types, () => $dev.desc(ins, { field: 'types' }));
        ins.set(p);
    });
