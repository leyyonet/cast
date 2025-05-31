import { Fqn } from '@leyyo/core';
import { Loader } from '@leyyo/injection';
import { FQN } from './internal';
import { castHub } from './hub';
import { $$castDecorators } from './decorators/internal.loader';
import { $$castAbstracts } from './object/internal.loader';

@Loader(castHub, ...$$castDecorators, ...$$castAbstracts)
@Fqn(FQN)
export class CastLoader {}
