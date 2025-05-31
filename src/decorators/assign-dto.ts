import { $assert, $dev, Arr, ClassLike, Func } from '@leyyo/common';
import { FQN } from '../internal';
import { decoratorPool, fqnHandler, nameHandler } from '@leyyo/core';
import { CastClass } from '../shared';
import { castHub } from '../hub';
import { AssignDtoOpt } from './index.types';

export function AssignDto(): ClassDecorator;
export function AssignDto(field: string): ClassDecorator;
export function AssignDto(field: string, values: Array<unknown>): ClassDecorator;
export function AssignDto(field?: string, values?: Array<unknown>): ClassDecorator {
    return <ClassDecorator>((clazz: Func) => id.process<ClassLike>([clazz], { field, values }));
}

const id = decoratorPool
    .newId<AssignDtoOpt>(AssignDto)
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
            nameHandler.set(clazz, naming.basic);
            fqnHandler.clazz(clazz, naming.pck);
        } else {
            nameHandler.set(clazz, ref.creator.name);
        }

        // sign proxy (build relation between old and new)
        castHub.depot.appendPointer(clazz, ref.creator);
        return clazz;
    });
