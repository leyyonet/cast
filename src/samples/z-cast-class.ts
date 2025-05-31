import { $is, $to, Dict } from '@leyyo/common';
import { Fqn } from '@leyyo/core';
import { AssignDto, AssignType, Cast, CastAlias } from '../decorators';
import { FQN } from '../internal';
import { CastDocCallback, CastDocResponse } from '../shared';

// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
@AssignType()
@CastAlias('Str2', 'str')
@Fqn(FQN)
export class MyStr {
    static doc(openApi: CastDocCallback): Dict {
        return { type: 'string' };
    }

    static canBe(value: unknown): boolean {
        return $is.text(value);
    }

    static exact(value: unknown): boolean {
        return typeof value === 'string';
    }

    static cast(value: unknown): string {
        return $to.text(value);
    }
}

// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
@AssignType()
@CastAlias('int')
@Fqn(FQN)
export class MyInt {
    static exact(value: unknown): boolean {
        return $is.integer(value);
    }

    static canBe(value: unknown): boolean {
        return typeof value === 'number';
    }

    static doc(openApi: CastDocCallback): CastDocResponse {
        return { type: 'integer' };
    }

    static cast(value: unknown): number {
        return $to.integer(value);
    }
}

@AssignDto()
@Fqn(FQN)
export class MyClass0 {
    @Cast('Str2')
    surname: string;
}

@AssignDto()
@Fqn(FQN)
export class MyClass extends MyClass0 {
    @Cast('MyStr')
    name: string;

    @Cast('MyInt')
    age: number;
}
