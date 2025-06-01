import { Arr, Dict } from '@leyyo/common';
import { Fqn } from '@leyyo/core';

import { FQN } from '../internal';
import { CastDocCallback, CastDocResponse, castHub } from '../hub';

// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected,JSUnusedGlobalSymbols, JSUnusedLocalSymbols
@Fqn(FQN)
export class AbstractDto {
    constructor(...args: Arr) {
        castHub.dto.onConstruct(this, ...args);
    }

    static doc(openApi: CastDocCallback): CastDocResponse {
        return castHub.dto.onDoc(this, openApi);
    }

    static cast(value: unknown): unknown {
        return castHub.dto.onCast(this, value);
    }

    static canBe(value: unknown): boolean {
        return castHub.dto.onCanBe(this, value);
    }

    static exact(value: unknown): boolean {
        return castHub.dto.onExact(this, value);
    }

    toJSON(): Dict {
        return castHub.dto.onJson(this, AbstractDto);
    }
}

/*
* function AssignCtor<T extends object>() {
    return class {
        constructor(t: T) {
            Object.assign(this, t)
        }
    } as { new(t: T): T }
}

interface CommunityProps {
    prop1: string
    prop2: number
    prop3: boolean
}
class Community extends AssignCtor<CommunityProps>() {

}

const comm = new Community({ prop1: "", prop2: 1, prop3: true });
console.log(comm.prop2.toFixed(1)) // 1.0
*
* */
