import { CastTokenized } from '../tokenizer';
import { CastBase } from '../pool';

export interface CastTupleLike {
    build(tokenized: CastTokenized): CastBase;
}
