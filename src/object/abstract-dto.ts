import { Arr, Dict } from '@leyyo/common';
import { Fqn } from '@leyyo/core';

import { FQN } from '../internal';
import { CastDocCallback, CastDocResponse } from '../pool';
import { dtoHelper } from '../dto';

// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected,JSUnusedGlobalSymbols, JSUnusedLocalSymbols
@Fqn(FQN)
export class AbstractDto {
    constructor(...args: Arr) {
        dtoHelper.onConstruct(this, ...args);
    }

    static doc(openApi: CastDocCallback): CastDocResponse {
        return dtoHelper.onDoc(this, openApi);
    }

    static cast(value: unknown): unknown {
        return dtoHelper.onCast(this, value);
    }

    static is(value: unknown): boolean {
        return dtoHelper.onIs(this, value);
    }

    toJSON(): Dict {
        return dtoHelper.toJson(this, AbstractDto);
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
