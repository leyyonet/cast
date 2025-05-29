import { CastName } from '../pool';
import { decoratorPool } from '@leyyo/core';
import { FQN } from '../internal';
import { $assert, $dev, Func } from '@leyyo/common';

export interface CastOpt {
    type: CastName;
    weak?: boolean;
}

export function Cast(type: CastName, weak?: boolean): PropertyDecorator;
export function Cast(type: CastName, weak?: boolean): ParameterDecorator;
export function Cast(type: CastName, weak: boolean = true): PropertyDecorator | ParameterDecorator {
    return (target: Func, property: string, index?: number) => deco.process([target, property, index], { type, weak });
}

const deco = decoratorPool
    .newId<CastOpt>(Cast)
    .fqn(FQN)
    .targets('field', 'parameter')
    .rules('no-multiple')
    .processor((ins, p) => {
        $assert.notEmpty(p.type, () => $dev.desc(ins, { field: 'type' }));
        $assert.boolean(p.weak, () => $dev.desc(ins, { field: 'weak' }));
        ins.set(p);
    });
