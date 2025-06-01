import { Fqn, fqnHandler } from '@leyyo/core';
import { $assert, $dev, $log, $repo, Arr, Func } from '@leyyo/common';
import { FQN } from '../internal';
import { CastClass, CastHubLike } from '../hub';
import {CastPendingLambda, CastPendingLike, CastTokenized} from './index.types';

// noinspection Annotator
@Fqn(FQN)
export class CastPending implements CastPendingLike {

    // region properties
    private readonly _METHODS = ['canBe', 'exact', 'cast', 'doc', 'castGen', 'docGen'] as Array<keyof CastClass>;
    private readonly _FIELDS = ['priority'] as Array<keyof CastClass>;
    private _items = $repo.newMap<string, Map<CastTokenized, CastPendingLambda>>(FQN, 'pending');
    private _systems = $repo.newList<CastClass>(FQN, '_systems');
    private _clones = $repo.newMap<CastClass, Array<Func>>(FQN, '_clones');
    private _clonedFunctions = $repo.newList<Func>(FQN, '_clonedFunctions');
    private logger = $log.create(CastPending);
    // endregion properties

    constructor(private hub: CastHubLike) {}

    addSystem(clazz: CastClass): void {
        $assert.func(clazz, () =>
            $dev.opt({
                field: 'class',
            }),
        );
        if (this._systems.includes(clazz)) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Already signed as a system',
                clazz: fqnHandler.get(clazz),
            });
        }
        this._systems.push(clazz);
    }

    addClone(clazz: CastClass, cloned: Func): void {
        $assert.func(clazz, () =>
            $dev.opt({
                field: 'class',
            }),
        );
        $assert.func(cloned, () =>
            $dev.opt({
                field: 'cloned',
            }),
        );
        if (this._clonedFunctions.includes(cloned)) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Already cloned',
                clazz: fqnHandler.get(cloned),
            });
        }
        this._clonedFunctions.push(cloned);

        if (!this._clones.has(clazz)) {
            this._clones.set(clazz, []);
        }
        this._clones.get(clazz).push(cloned);
    }

    processSystem(): void {
        this._systems.forEach((clazz) => {
            this.hub.depot.get(clazz, true).value.push('system');
        });
        this._systems.clear();
    }

    processClone(): void {
        this._clones.forEach((functions, source) => {
            const bbb = this.hub.depot.get(source, true);
            functions.forEach((target) => {
                if (this.hub.depot.has(target)) {
                    throw $dev.developerError2(FQN, 100, {
                        message: 'Target was already defined',
                        target: fqnHandler.get(target),
                    });
                }
                this._METHODS.forEach((field) => {
                    if (typeof source[field as string] === 'function') {
                        target[field as string] = (...args: Arr) => source[field as string](...args);
                    }
                });
                this._FIELDS.forEach((field) => {
                    if (typeof source[field as string] !== 'undefined') {
                        target[field as string] = source[field as string];
                    }
                });
                this.hub.depot.appendPointer(target, source);
                this.hub.depot.$secure.$appendAlias(bbb, source.name, 'custom');
            });
        });
        this._clones.clear();
        this._clonedFunctions.clear();
    }

    queue(tokenized: CastTokenized, fn: CastPendingLambda): void {
        $assert.bareObject(tokenized, () =>
            $dev.opt({
                field: 'tokenized',
                method: 'queue',
                where: 'leyyo.cast.CastPending',
            }),
        );
        $assert.func(fn, () => $dev.opt({ field: 'fn', method: 'queue', where: 'leyyo.cast.CastPending' }));
        if (!this._items.has(tokenized.main)) {
            this._items.set(tokenized.main, new Map());
        }
        if (!this._items.get(tokenized.main).has(tokenized)) {
            this._items.get(tokenized.main).set(tokenized, fn);
            const encoded = this.hub.tokenizer.stringify(tokenized);
            this.logger.debug(`${encoded} iii queued`);
        }
    }

    complete(tokenized: CastTokenized): void {
        if (this.has(tokenized)) {
            this._items.get(tokenized.main).get(tokenized)(tokenized);
            this._items.get(tokenized.main).delete(tokenized);
            if (this._items.get(tokenized.main).size < 1) {
                this._items.delete(tokenized.main);
            }
        } else if (tokenized.main && this._items.has(tokenized.main)) {
            this._items.get(tokenized.main).forEach((fn, t) => {
                fn(t);
            });
        }
    }

    has(tokenized: CastTokenized): boolean {
        return tokenized && this._items.has(tokenized.main) && this._items.get(tokenized.main).has(tokenized);
    }

    list(): Array<CastTokenized> {
        const result = [] as Array<CastTokenized>;
        Array.from(this._items.values()).forEach((tokens) => {
            result.push(...Array.from(tokens.keys()));
        });
        return result;
    }
}
