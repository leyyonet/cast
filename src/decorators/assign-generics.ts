import { decoratorPool } from '@leyyo/core';
import { FQN } from '../internal';
import { $assert, $dev } from '@leyyo/common';

export interface AssignGenericsOpt {
    min: number;
    max: number;
    aliases: Array<string>;
}

export function AssignGenerics(min: number, max: number, ...aliases: Array<string>): ClassDecorator {
    return (clazz) => deco.process([clazz], { min, max, aliases });
}

const deco = decoratorPool
    .newId<AssignGenericsOpt>(AssignGenerics)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple', 'no-inherited', 'no-copy')
    .processor((ins, p) => {
        $assert.integer(p.min, () => $dev.desc(ins, { field: 'min' }));
        $assert.integer(p.max, () => $dev.desc(ins, { field: 'max' }));
        if (!Array.isArray(p.aliases)) {
            p.aliases = [];
        }
        if (p.aliases.length > 0) {
            $assert.textArray(p.aliases, () => $dev.desc(ins, { field: 'aliases' }));
        }
        ins.set(p);
    });
