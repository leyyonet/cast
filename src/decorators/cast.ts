import { $assert, $dev, Func } from '@leyyo/common';
import { decoratorPool } from '@leyyo/core';

import { FQN } from '../internal';
import { CastOpt } from './index.types';
import { CastName } from '../hub';

export function Cast(type: CastName, weak?: boolean): PropertyDecorator;
export function Cast(type: CastName, weak?: boolean): ParameterDecorator;
export function Cast(type: CastName, weak: boolean = true): PropertyDecorator | ParameterDecorator {
    return (target: Func, property: string, index?: number) => id.process([target, property, index], { type, weak });
}

const id = decoratorPool
    .newId<CastOpt>(Cast)
    .fqn(FQN)
    .targets('field', 'parameter')
    .rules('no-multiple')
    .processor((ins, p) => {
        $assert.notEmpty(p.type, () => $dev.desc(ins, { field: 'type' }));
        $assert.booleanOptional(p.weak, () => $dev.desc(ins, { field: 'weak' }));
        ins.set(p);
    });
