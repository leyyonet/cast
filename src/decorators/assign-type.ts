import { decoratorPool } from '@leyyo/core';
import { FQN } from '../internal';

export function AssignType(): ClassDecorator {
    return (clazz) => id.process([clazz], {});
}

const id = decoratorPool
    .newId(AssignType)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple', 'no-inherited', 'no-copy')
    .processor((ins, p) => {
        ins.set(p);
    });
