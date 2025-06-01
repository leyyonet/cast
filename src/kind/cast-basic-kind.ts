import { $dev, $log, ClassLike, Func } from '@leyyo/common';
import { ClassReflectionLike, Fqn, reflectionPool } from '@leyyo/core';

import { FQN } from '../internal';
import { CastBase, CastClass, CastHubLike } from '../hub';

import { CastBasicKindLike } from './index.types';
import { AssignTypeOpt, CastAliasOpt } from '../decorators';
import {CastTokenized} from "../process";

// noinspection Annotator
@Fqn(FQN)
export class CastBasicKind implements CastBasicKindLike {
    private readonly logger = $log.create(CastBasicKind);

    constructor(private hub: CastHubLike) {}

    // region private
    private _build(clazz: CastClass): void {
        if (typeof clazz.exact !== 'function') {
            clazz.exact = (_v) => false;
            this.logger.deploy.$warning(FQN, 100, { message: `Class[${clazz.name}] has not "exact" method` });
        }
        if (typeof clazz.canBe !== 'function') {
            clazz.canBe = (_v) => false;
            this.logger.deploy.$warning(FQN, 100, { message: `Class[${clazz.name}] has not "canBe" method` });
        }
        if (typeof clazz.doc !== 'function') {
            clazz.doc = (openApi) => openApi(clazz, {});
            this.logger.deploy.$warning(FQN, 100, { message: `Class[${clazz.name}] has not "doc" method` });
        }
        if (typeof clazz.cast !== 'function') {
            if (typeof clazz.prototype?.constructor === 'function') {
                switch (clazz.prototype.constructor.length) {
                    case 0:
                        clazz.cast = (value) => Object.assign(new clazz(), value);
                        break;
                    case 1:
                        clazz.cast = (value) => new clazz(value);
                        break;
                    default:
                        clazz.cast = (value) => Object.assign(Object.create(clazz.prototype), value);
                        break;
                }
            } else {
                clazz.cast = (value) => Object.assign(new clazz(), value);
            }
            this.logger.deploy.$warning(FQN, 100, { message: `Class[${clazz.name}] has not "cast" method` });
        }
    }

    // endregion private

    fetchAlias(v1: ClassReflectionLike | ClassLike | Func, opt: CastAliasOpt): void {
        const clazz = (typeof v1 === 'function' ? v1 : v1.creator) as CastClass;
        const bbb = this.hub.depot.get(clazz, true);
        const added = [bbb.basic, bbb.full] as Array<string>;
        opt.aliases.forEach((alias) => {
            if (!added.includes(alias)) {
                const other = this.hub.depot.get(alias, false);
                if (other) {
                    throw $dev.developerError2(FQN, 100, {
                        message: 'Alias is duplicated',
                        clazz: bbb.full,
                        alias,
                        other: other.full,
                    });
                }
                this.hub.depot.$secure.$appendAlias(bbb, alias, 'alias');
                added.push(alias);
            }
        });
    }

    addNative(fn: Func): void {
        const tokenized = this.hub.tokenizer.parse(fn, true);
        const classRef = reflectionPool.get(fn);
        if (classRef) {
            this.fetch(classRef, {});
            this.process(classRef);
        } else {
            this._build(fn as CastClass);
            this.hub.check.save(fn as CastClass, { tokenized });
        }
    }

    fetch(classRef: ClassReflectionLike, opt: AssignTypeOpt): void {
        const clazz = classRef.creator as CastClass;
        const tokenized = this.hub.tokenizer.parse(clazz, true);
        const encoded = this.hub.tokenizer.stringify(tokenized);

        this.hub.check.checkDuplicated(clazz, encoded);

        const bbb = this.hub.check.save(clazz, { tokenized });
        bbb.value.main = opt?.main;
        if (bbb.value.main) {
            this.hub.depot.$secure.$appendAlias(bbb, bbb.value.main, 'custom');
        }
        bbb.value.push('from-type');
    }

    process(classRef: ClassReflectionLike): void {
        const clazz = classRef.creator as CastClass;
        this._build(clazz);
    }

    build(tokenized: CastTokenized): CastBase {
        if (!tokenized.main) {
            return undefined;
        }
        if (this.hub.depot.has(tokenized.main)) {
            return this.hub.depot.get(tokenized.main);
        }
        if (this.hub.enum.canBe(tokenized.main)) {
            return this.hub.enum.build(tokenized.main);
        }
        if (!this.hub.pending.has(tokenized)) {
            this.hub.pending.queue(tokenized, (t) => this.build(t));
        }
        return undefined;
    }
}
