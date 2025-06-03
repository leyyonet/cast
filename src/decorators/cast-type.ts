import {$assert, $dev, ClassLike, Func} from '@leyyo/common';
import { decoratorPool } from '@leyyo/core';

import { FQN } from '../internal';
import {CastTypeOpt} from "./index.types";

export function CastType(type: Func|ClassLike, isAsync?: boolean): MethodDecorator & PropertyDecorator & ParameterDecorator {
    return (target: Func, property: string, indexOrDescriptor?: number|TypedPropertyDescriptor<unknown>) => id.process([target, property, indexOrDescriptor], { type, isAsync });
}

const id = decoratorPool
    .newId<CastTypeOpt>(CastType)
    .fqn(FQN)
    .targets('field', 'parameter', 'method')
    .rules('no-multiple')
    .processor((ins, p) => {
        $assert.func(p.type, () => $dev.desc(ins, { field: 'type' }));
        $assert.booleanOptional(p.isAsync, () => $dev.desc(ins, { field: 'isAsync' }));
        
        switch (ins.target) {
            case 'parameter':
                ins.asParameter.$secure.$setType(p.type as Func);
                break;
            case 'field':
            case 'method':
                ins.asProperty.$secure.$setType(p.type as Func);
                break;
        }
        ins.set(p);
    });
