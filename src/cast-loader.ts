import { Fqn, Loader } from '@leyyo/core';
import { FQN } from './internal';
import { castPool } from './pool';
import { $$castDecorators } from './decorators/internal.loader';
import { $$castAbstracts } from './object/internal.loader';

@Loader(castPool, ...$$castDecorators, ...$$castAbstracts)
@Fqn(FQN)
export class CastLoader {}
