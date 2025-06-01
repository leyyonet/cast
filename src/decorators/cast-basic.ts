import { decoratorPool } from '@leyyo/core';
import { FQN } from '../internal';
import { AssignTypeOpt } from './index.types';

export function CastBasic(main?: string): ClassDecorator {
    return (clazz) => id.process([clazz], { main });
}

const id = decoratorPool
    .newId<AssignTypeOpt>(CastBasic)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple', 'no-inherited', 'no-copy')
    .processor((ins, p) => {
        ins.set(p);
    });
