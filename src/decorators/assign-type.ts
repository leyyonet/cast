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
    .rules('no-multiple', 'no-inherited')
    .processor((ins, p) => {
        if (!Array.isArray(p.aliases)) {
            p.aliases = [];
        }
        if (p.aliases.length > 0) {
            $assert.textArray(p.aliases, () => $dev.desc(ins, { field: 'aliases' }));
        }
        ins.set(p);
    });
/*
*         const clazz = ins.asClass.creator;
        const like = clazz as unknown as TypeLike;

        switch (castPool.analyse(like)) {
            case 'type-static':
                castPool.type.addType(like, 'type', ...p.aliases);
                break;
            case 'type-instance':
                castPool.type.addType((clazz).prototype as TypeLike, 'type', ...p.aliases);
                break;
            default:
                throw $dev.invalidError({issue: 'type.invalid-function', desc: ins.description});
        }

* */
