import { decoratorPool } from '@leyyo/core';
import { $assert, $dev } from '@leyyo/common';

import { FQN } from '../internal';
import { AssignMergeOpt } from './index.types';

export function CastMerge(pattern: string): ClassDecorator {
    return (clazz) => id.process([clazz], { pattern });
}

const id = decoratorPool
    .newId<AssignMergeOpt>(CastMerge)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple', 'no-inherited', 'no-copy')
    .processor((ins, p) => {
        $assert.text(p.pattern, () => $dev.desc(ins, { field: 'pattern' }));
        if (!p.pattern.includes('|')) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Invalid merge pattern',
                desc: ins.description,
            });
        }
        ins.set(p);
    });
