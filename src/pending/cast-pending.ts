import { Fqn, fqnHandler } from '@leyyo/core';
import { $assert, $dev, $log, $repo, Arr, Func } from '@leyyo/common';
import { FQN } from '../internal';
import { CastPendingLambda, CastPendingLike } from './index.types';
import { CastHubLike } from '../hub';
import { CastClass, CastTokenized } from '../shared';

// noinspection Annotator
@Fqn(FQN)
export class CastPending implements CastPendingLike {
    protected readonly _METHODS = ['canBe', 'exact', 'cast', 'doc', 'castGen', 'docGen'] as Array<keyof CastClass>;
    protected readonly _FIELDS = ['priority'] as Array<keyof CastClass>;
    protected items = $repo.newMap<string, Map<CastTokenized, CastPendingLambda>>(FQN, 'pending');
    protected systems = $repo.newList<CastClass>(FQN, 'systems');
    protected clones = $repo.newMap<CastClass, Array<Func>>(FQN, 'clones');
    protected clonedFunctions = $repo.newList<Func>(FQN, 'clonedFunctions');
    protected logger = $log.create(CastPending);

    constructor(private hub: CastHubLike) {}

    addSystem(clazz: CastClass): void {
        $assert.func(clazz, () =>
            $dev.opt({
                field: 'class',
            }),
        );
        if (this.systems.includes(clazz)) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Already signed as a system',
                clazz: fqnHandler.get(clazz),
            });
        }
        this.systems.push(clazz);
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
        if (this.clonedFunctions.includes(cloned)) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Already cloned',
                clazz: fqnHandler.get(cloned),
            });
        }
        this.clonedFunctions.push(cloned);

        if (!this.clones.has(clazz)) {
            this.clones.set(clazz, []);
        }
        this.clones.get(clazz).push(cloned);
    }

    processSystem(): void {
        this.systems.forEach((clazz) => {
            this.hub.depot.get(clazz, true).value.push('system');
        });
        this.systems.clear();
    }

    processClone(): void {
        this.clones.forEach((functions, source) => {
            const base = this.hub.depot.get(source, true);
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
                this.hub.depot.$secure.$appendAlias(base, source.name, 'custom');
            });
        });
        this.clones.clear();
        this.clonedFunctions.clear();
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
        if (!this.items.has(tokenized.base)) {
            this.items.set(tokenized.base, new Map());
        }
        if (!this.items.get(tokenized.base).has(tokenized)) {
            this.items.get(tokenized.base).set(tokenized, fn);
            const encoded = this.hub.tokenizer.stringify(tokenized);
            this.logger.debug(`${encoded} iii queued`);
        }
    }

    complete(tokenized: CastTokenized): void {
        if (this.has(tokenized)) {
            this.items.get(tokenized.base).get(tokenized)(tokenized);
            this.items.get(tokenized.base).delete(tokenized);
            if (this.items.get(tokenized.base).size < 1) {
                this.items.delete(tokenized.base);
            }
        } else if (tokenized.base && this.items.has(tokenized.base)) {
            this.items.get(tokenized.base).forEach((fn, t) => {
                fn(t);
            });
        }
    }

    has(tokenized: CastTokenized): boolean {
        return tokenized && this.items.has(tokenized.base) && this.items.get(tokenized.base).has(tokenized);
    }

    list(): Array<CastTokenized> {
        const result = [] as Array<CastTokenized>;
        Array.from(this.items.values()).forEach((tokens) => {
            result.push(...Array.from(tokens.keys()));
        });
        return result;
    }
}

// Array<Customer>
