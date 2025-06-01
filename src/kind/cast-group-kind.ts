import {$log, $name} from '@leyyo/common';
import { fqnHandler } from '@leyyo/core';

import { CastBase, CastClass, CastHubLike } from '../hub';
import { FQN } from '../internal';
import { CastGroupKindLike } from './index.types';
import {CastTokenized} from "../process";

export class CastGroupKind implements CastGroupKindLike {
    // region properties
    private readonly logger = $log.create(CastGroupKind);
    private readonly _methods = ['cast', 'castGen', 'exact', 'canBe', 'doc', 'docGen'] as Array<keyof CastClass>;
    // endregion properties

    constructor(private hub: CastHubLike) {}

    build(tokenized: CastTokenized): CastBase {
        const encoded = this.hub.tokenizer.stringify(tokenized);
        let bbb = this.hub.depot.get(encoded);
        if (bbb) {
            return bbb;
        }
        const child = tokenized.children[0];
        if (!child.clazz) {
            if (!this.hub.pending.has(tokenized)) {
                this.hub.pending.queue(tokenized, (t) => this.build(t));
            }
            return undefined;
        }

        const clazz = class {} as CastClass;

        clazz.priority = child.clazz.priority;
        this._methods.forEach(method => {
            if (typeof child.clazz === 'function') {
                // @ts-ignore
                clazz[method] = (...a: Array<any>) => child.clazz[method](...a);
            }
        })

        const name = $name.anonymous('Group');
        $name.set(clazz, name);
        fqnHandler.clazz(clazz, FQN);

        bbb = this.hub.check.save(clazz, { tokenized });

        return bbb;
    }
}
