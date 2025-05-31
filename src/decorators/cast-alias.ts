import { $assert, $dev } from '@leyyo/common';
import { FQN } from '../internal';
import { decoratorPool } from '@leyyo/core';
import { CastAliasOpt } from './index.types';

export function CastAlias(...aliases: Array<string>): ClassDecorator {
    return (clazz) => id.process([clazz], { aliases });
}

const id = decoratorPool
    .newId<CastAliasOpt>(CastAlias)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple')
    .processor((ins, p) => {
        $assert.textArray(p.aliases, () => $dev.desc(ins, { field: 'aliases' }));
        if (p.aliases.length > 5) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Alias size exceeded, max: 5',
                desc: ins.description,
            });
        }
        ins.set(p);
    });
