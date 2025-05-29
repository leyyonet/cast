import { DecoInstanceLike, PropertyReflectionLike } from '@leyyo/core';
import { CastOpt } from '../decorators';

export interface CastRefactorLike {
    property(ins: DecoInstanceLike, opt: CastOpt): void;

    parameter(ins: DecoInstanceLike, opt: CastOpt): void;

    hasMethod(ref: PropertyReflectionLike): boolean;

    runForMethod(ref: PropertyReflectionLike, values: Array<any>): Array<any>;
}
