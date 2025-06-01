import {$dev, $is, $log, $name, Arr} from '@leyyo/common';
import { ClassReflectionLike, fqnHandler, reflectionPool } from '@leyyo/core';

import { CastBase, CastClass, CastDocLambda, CastHubLike, CastIsLambda, CastLambda } from '../hub';
import { FQN } from '../internal';
import { AssignTupleOpt, CastBasic, CastDto, CastGenerics, CastUnion } from '../decorators';
import { CastTupleKindLike } from './index.types';
import {CastTokenized} from "../process";

export class CastTupleKind implements CastTupleKindLike {
    // region properties
    private readonly logger = $log.create(CastTupleKind);
    // endregion properties

    constructor(private hub: CastHubLike) {}

    // region private
    private _buildCastLambda(classes: Array<CastClass>, types: Array<string>): CastLambda {
        return (value) => {
            if ($is.empty(value)) {
                return value;
            }
            if (!$is.arrayLike(value)) {
                throw $dev.invalidError({
                    message: 'Unexpected tuple value',
                    type: typeof value,
                    expected: `[${types.join(',')}]`,
                });
            }
            let arr: Arr;
            if (value instanceof Set) {
                arr = Array.from(value.values());
            } else {
                arr = value as Arr;
            }
            return classes.map((clazz, index) => clazz.cast(arr[index]));
        };
    }

    private _buildExactLambda(classes: Array<CastClass>): CastIsLambda {
        return (value) => {
            if ($is.empty(value)) {
                return false;
            }
            if (!$is.arrayLike(value)) {
                return false;
            }
            let arr: Arr;
            if (value instanceof Set) {
                arr = Array.from(value.values());
            } else {
                arr = value as Arr;
            }
            return classes.every((clazz, index) => clazz.exact(arr[index]));
        };
    }

    private _buildCanBeLambda(classes: Array<CastClass>): CastIsLambda {
        return (value) => {
            if ($is.empty(value)) {
                return false;
            }
            if (!$is.arrayLike(value)) {
                return false;
            }
            let arr: Arr;
            if (value instanceof Set) {
                arr = Array.from(value.values());
            } else {
                arr = value as Arr;
            }
            return classes.every((clazz, index) => clazz.canBe(arr[index]));
        };
    }

    private _buildDocLambda(clazz: CastClass, classes: Array<CastClass>): CastDocLambda {
        return (openApi) => {
            return openApi(clazz, {
                type: 'array',
                prefixItems: classes.map((clz) => clz.doc(openApi)),
            });
        };
    }

    private _process(bbb: CastBase): CastBase {
        const tokenized = bbb.value.tokenized;
        const children = tokenized.children.map((child) => this.hub.discover.build(child));
        const classes = children.map((child) => child.value.clazz);
        const types = classes.map((clazz) => fqnHandler.get(clazz));
        const clazz = bbb.value.clazz;

        if (!$is.bareObject(clazz.priority)) {
            clazz.priority = { array: 1, instance: [[Set, 5]] };
        }
        if (typeof clazz.cast !== 'function') {
            clazz.cast = this._buildCastLambda(classes, types);
        }
        if (typeof clazz.exact !== 'function') {
            clazz.exact = this._buildExactLambda(classes);
        }
        if (typeof clazz.canBe !== 'function') {
            clazz.canBe = this._buildCanBeLambda(classes);
        }
        if (typeof clazz.doc !== 'function') {
            clazz.doc = this._buildDocLambda(clazz, classes);
        }

        const ref = reflectionPool.registerClass(clazz);
        classes.forEach((cls) => {
            if (reflectionPool.isRegistered(cls)) {
                ref.copyDecorators(reflectionPool.get(cls));
            }
        });
        return bbb;
    }

    // endregion private

    fetch(classRef: ClassReflectionLike, opt: AssignTupleOpt): void {
        this.hub.check.notDecoratedBy(classRef, CastBasic, CastDto, CastGenerics, CastUnion);
        const clazz = classRef.creator as CastClass;
        const tokenized = this.hub.tokenizer.parse(opt.pattern, true);
        const encoded = this.hub.tokenizer.stringify(tokenized);
        this.hub.check.checkDuplicated(clazz, encoded);

        this.hub.check.save(clazz, { tokenized }).value.push('from-tuple');
    }

    process(classRef: ClassReflectionLike): void {
        const clazz = classRef.creator as CastClass;

        const bbb = this.hub.depot.get(clazz);
        const tokenized = bbb.value.tokenized;
        const children = tokenized.children.map((child) => this.hub.discover.build(child));
        if (children.some((b) => !b)) {
            if (!this.hub.pending.has(tokenized)) {
                this.hub.pending.queue(tokenized, (_t) => this._process(bbb));
            }
            return;
        }
        this._process(bbb);
    }

    build(tokenized: CastTokenized): CastBase {
        const encoded = this.hub.tokenizer.stringify(tokenized);
        let bbb = this.hub.depot.get(encoded);
        if (bbb) {
            return bbb;
        }
        const children = tokenized.children.map((child) => this.hub.discover.build(child));
        if (children.some((b) => !b)) {
            if (!this.hub.pending.has(tokenized)) {
                this.hub.pending.queue(tokenized, (t) => this.build(t));
            }
            return undefined;
        }
        const classes = children.map((child) => child.value.clazz);
        const types = classes.map((clazz) => fqnHandler.get(clazz));

        const clazz = class {} as CastClass;

        clazz.priority = { array: 1, instance: [[Set, 5]] };
        clazz.cast = this._buildCastLambda(classes, types);
        clazz.exact = this._buildExactLambda(classes);
        clazz.canBe = this._buildCanBeLambda(classes);
        clazz.doc = this._buildDocLambda(clazz, classes);

        const name = $name.anonymous('Tuple');
        $name.set(clazz, name);
        fqnHandler.clazz(clazz, FQN);

        const ref = reflectionPool.registerClass(clazz);
        classes.forEach((cls) => {
            if (reflectionPool.isRegistered(cls)) {
                ref.copyDecorators(reflectionPool.get(cls));
            }
        });

        bbb = this.hub.check.save(clazz, { tokenized });

        return bbb;
    }
}
