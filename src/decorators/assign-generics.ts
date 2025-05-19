import { decoratorPool } from '@leyyo/core';
import { FQN } from '../internal';
import { $assert, $dev } from '@leyyo/common';

export interface AssignGenericsOpt {
    min: number;
    max: number;
    aliases: Array<string>;
}

export function AssignGenerics(min: number, max: number, ...aliases: Array<string>): ClassDecorator {
    return clazz =>
        deco.process([clazz], { min, max, aliases });
}

const deco = decoratorPool
    .newId<AssignGenericsOpt>(AssignGenerics)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple', 'no-inherited')
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

/*
*         const clazz = ins.asClass.creator;
        const like = clazz as unknown as TypeLike;
        switch (castPool.analyse(like)) {
            case 'generic-static':
                castPool.type.addType(like, 'generics', ...p.aliases);
                break;
            case 'generic-instance':
                castPool.type.addType(clazz.prototype as TypeLike, 'generics', ...p.aliases);
                break;
            default:
                throw $dev.invalidError({ issue: 'generic.invalid-function', desc: ins.description });
        }

* */
