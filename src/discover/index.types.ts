import { CastClass } from '../basic';
import { CastBase, CastName } from '../pool';
import { CastTokenized } from '../tokenizer';

export interface CastDiscoverLike {
    find(clazz: CastName, required?: boolean): CastClass;

    run(clazz: CastName, value: unknown): unknown;

    build(tokenized: CastTokenized): CastBase;
}
