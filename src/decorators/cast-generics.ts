import { decoratorPool } from '@leyyo/core';
import { FQN } from '../internal';
import {$assert, $dev, Dict} from '@leyyo/common';
import { AssignGenericsOpt } from './index.types';

interface P {
    v1: number;
    v2: number;
}
export function CastGenerics(max: number): ClassDecorator;
export function CastGenerics(min: number, max: number): ClassDecorator;
export function CastGenerics(v1: number, v2?: number): ClassDecorator {
    return (clazz) => id.process([clazz], { v1, v2 });
}

const id = decoratorPool
    .newId<AssignGenericsOpt, Dict, P>(CastGenerics)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple', 'no-inherited', 'no-copy')
    .processor((ins, p) => {
        const opt = {} as AssignGenericsOpt;
        if (p.v2 !== undefined) {
            opt.min = p.v1;
            opt.max = p.v2;
        }
        else {
            opt.min = 0;
            opt.max = p.v1;
        }
        $assert.integer(opt.min, () => $dev.desc(ins, { field: 'min' }));
        $assert.positiveInteger(opt.max, () => $dev.desc(ins, { field: 'max' }));
        if (opt.min < 0) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Invalid minimum arguments in generics, min: 0',
                desc: ins.description,
                min: opt.min,
            });
        }
        if (opt.max > 10) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Arguments size exceeded in generics, max: 10',
                desc: ins.description,
                max: opt.max,
            });
        }
        if (opt.min > opt.max) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Invalid maximum arguments in generics, min > max',
                desc: ins.description,
                min: opt.min,
                max: opt.max,
            });
        }
        ins.set(opt);
    });
