import {$assert, $dev, $name, Arr, ClassLike, Func} from '@leyyo/common';
import { decoratorPool, fqnHandler } from '@leyyo/core';

import { FQN } from '../internal';
import { CastClass, castHub } from '../hub';
import { AssignDtoOpt } from './index.types';

export function CastDto(field?: string, values?: Array<unknown>): ClassDecorator {
    return <ClassDecorator>((clazz: Func) => id.process<ClassLike>([clazz], { field, values }));
}

const id = decoratorPool
    .newId<AssignDtoOpt>(CastDto)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple')
    .processor((ins, p) => {
        const ref = ins.asClass;

        $assert.textOptional(p.field, () => $dev.desc(ins, { field: 'field' }));
        $assert.arrayOptional(p.values, () => $dev.desc(ins, { field: 'values' }));
        if (p.values !== undefined && p.values.length < 1) {
            delete p.values;
        }
        ins.set(p);

        // noinspection JSUnusedGlobalSymbols
        const clazz = class extends ref.creator {
            constructor(...args: Arr) {
                super(...args);
                castHub.dto.onConstruct(this, ...args);
            }
        } as CastClass;

        const naming = fqnHandler.$secure.$get(ref.creator);
        if (naming) {
            $name.set(clazz, naming.basic);
            fqnHandler.clazz(clazz, naming.pck);
        } else {
            $name.set(clazz, ref.creator.name);
        }

        // sign proxy (build relation between old and new)
        castHub.depot.appendPointer(clazz, ref.creator);
        return clazz;
    });
