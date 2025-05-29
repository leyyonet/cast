import { decoratorPool } from '@leyyo/core';
import { FQN } from '../internal';
import { $assert, $dev } from '@leyyo/common';

export interface DiscriminatorOpt {
    field: string;
    values: Array<unknown>;
}

export function Discriminator(field: string, ...values: Array<unknown>): ClassDecorator {
    return (clazz) => deco.process([clazz], { field, values });
}

const deco = decoratorPool
    .newId<DiscriminatorOpt>(Discriminator)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple')
    .processor((ins, p) => {
        $assert.text(p.field, () => $dev.desc(ins, { field: 'field' }));
        $assert.arrayOptional(p.values, () => $dev.desc(ins, { field: 'values' }));
        ins.set(p);
    });
