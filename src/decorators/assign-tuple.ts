import { decoratorPool } from '@leyyo/core';
import { $assert, $dev } from '@leyyo/common';

import { FQN } from '../internal';
import { AssignTupleOpt } from './index.types';

export function AssignTuple(pattern: string): ClassDecorator {
    return (clazz) => id.process([clazz], { pattern });
}

const id = decoratorPool
    .newId<AssignTupleOpt>(AssignTuple)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple', 'no-inherited', 'no-copy')
    .processor((ins, p) => {
        $assert.text(p.pattern, () => $dev.desc(ins, { field: 'pattern' }));
        if (!p.pattern.startsWith('[') || p.pattern.endsWith(']')) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Invalid tuple pattern',
                desc: ins.description,
            });
        }
        ins.set(p);
    });
