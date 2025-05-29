import { $assert, $dev, Arr, ClassLike, Func } from '@leyyo/common';
import { FQN } from '../internal';
import { decoratorPool, fqnHandler, reflectionPool } from '@leyyo/core';
import { CastClass } from '../basic';
import { dtoHelper } from '../dto';

export interface DtoOpt {
    aliases: Array<string>;
}

export function Dto(...aliases: Array<string>): ClassDecorator {
    return <ClassDecorator>((clazz: Func) => deco.process<ClassLike>([clazz], { aliases }));
}

const deco = decoratorPool
    .newId<DtoOpt>(Dto)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple')
    .processor((ins, p) => {
        const ref = ins.asClass;

        // noinspection JSUnusedGlobalSymbols
        const clazz = class extends ref.creator {
            constructor(...args: Arr) {
                super(...args);
                dtoHelper.onConstruct(this, ...args);
            }
        } as CastClass;

        dtoHelper.checkClass(clazz);
        const naming = fqnHandler.$secure.$get(ref.creator) ?? ref.creator.name;
        dtoHelper.changeNaming(clazz, naming as string);

        // sign proxy (build relation between old and new)
        reflectionPool.addProxy(ref.creator, clazz);

        if (!Array.isArray(p.aliases)) {
            p.aliases = [];
        }
        if (p.aliases.length > 0) {
            $assert.textArray(p.aliases, () => $dev.desc(ins, { field: 'aliases' }));
        }

        ins.set(p);
        return clazz;
    });
