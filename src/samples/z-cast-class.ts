import { $is, $to, Dict } from '@leyyo/common';
import { Fqn } from '@leyyo/core';
import { AssignType, Cast, Dto } from '../decorators';
import { FQN } from '../internal';

// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
@AssignType('Str2', 'str')
@Fqn(FQN)
export class MyStr {
    static doc(target: unknown, propertyKey: string, openApi: Dict): Dict {
        return { type: 'string' };
    }

    static is(value: unknown): boolean {
        return $is.text(value);
    }

    static cast(value: unknown): string {
        return $to.text(value);
    }
}

// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
@AssignType('int')
@Fqn(FQN)
export class MyInt {
    static is(value: unknown): boolean {
        return $is.integer(value);
    }

    static doc(target: unknown, propertyKey: PropertyKey, openApi: Dict): Dict {
        return { type: 'integer' };
    }

    static cast(value: unknown): number {
        return $to.integer(value);
    }
}

@Dto()
@Fqn(FQN)
export class MyClass0 {
    @Cast('Str2')
    surname: string;
}

@Dto()
@Fqn(FQN)
export class MyClass extends MyClass0 {
    @Cast('MyStr')
    name: string;

    @Cast('MyInt')
    age: number;
}
