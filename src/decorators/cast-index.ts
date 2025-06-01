import { decoratorPool } from '@leyyo/core';
import { FQN } from '../internal';
import { $assert, $dev } from '@leyyo/common';

import type { GenericsIndexOpt } from './index.types';
import { CastName } from '../hub';

export function CastIndex(index: number, def?: CastName): PropertyDecorator {
    return (clazz, propertyKey) => id.process([clazz, propertyKey], { index, def });
}

const id = decoratorPool
    .newId<GenericsIndexOpt>(CastIndex)
    .fqn(FQN)
    .targets('field')
    .rules('no-multiple', 'no-inherited', 'no-copy')
    .processor((ins, p) => {
        $assert.integer(p.index, () => $dev.desc(ins, { field: 'index' }));
        ins.set(p);
    });
