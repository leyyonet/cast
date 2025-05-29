import { decoratorPool } from '@leyyo/core';
import { FQN } from '../internal';
import { $assert, $dev } from '@leyyo/common';

export interface AssignTypeOpt {
    aliases: Array<string>;
}

export function AssignType(...aliases: Array<string>): ClassDecorator {
    return (clazz) => deco.process([clazz], { aliases });
}

const deco = decoratorPool
    .newId<AssignTypeOpt>(AssignType)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple', 'no-inherited', 'no-copy')
    .processor((ins, p) => {
        if (!Array.isArray(p.aliases)) {
            p.aliases = [];
        }
        if (p.aliases.length > 0) {
            $assert.textArray(p.aliases, () => $dev.desc(ins, { field: 'aliases' }));
        }
        ins.set(p);
    });
