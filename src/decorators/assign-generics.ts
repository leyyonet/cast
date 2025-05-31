import { decoratorPool } from '@leyyo/core';
import { FQN } from '../internal';
import { $assert, $dev } from '@leyyo/common';
import { AssignGenericsOpt } from './index.types';

export function AssignGenerics(min: number, max: number): ClassDecorator {
    return (clazz) => id.process([clazz], { min, max });
}

const id = decoratorPool
    .newId<AssignGenericsOpt>(AssignGenerics)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple', 'no-inherited', 'no-copy')
    .processor((ins, p) => {
        $assert.integer(p.min, () => $dev.desc(ins, { field: 'min' }));
        $assert.positiveInteger(p.max, () => $dev.desc(ins, { field: 'max' }));
        if (p.min < 0) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Invalid minimum arguments in generics, min: 0',
                desc: ins.description,
                min: p.min,
            });
        }
        if (p.max > 10) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Arguments size exceeded in generics, max: 10',
                desc: ins.description,
                max: p.max,
            });
        }
        if (p.min > p.max) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Invalid maximum arguments in generics, min > max',
                desc: ins.description,
                min: p.min,
                max: p.max,
            });
        }
        ins.set(p);
    });
