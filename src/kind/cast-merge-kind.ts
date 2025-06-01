import {$is, $log, $name} from '@leyyo/common';
import { ClassReflectionLike, fqnHandler, reflectionPool } from '@leyyo/core';

import { CastBase, CastClass, CastHubLike } from '../hub';
import { FQN } from '../internal';
import { AssignMergeOpt, CastBasic, CastDto, CastGenerics, CastTuple } from '../decorators';
import { CastMergeKindLike, CastPriority } from './index.types';
import { CastTokenized } from '../process';

export class CastMergeKind implements CastMergeKindLike {

    // region properties
    private readonly logger = $log.create(CastMergeKind);
    // endregion properties

    constructor(private hub: CastHubLike) {}

    // region private
    private _buildPriority(classes: Array<CastClass>): CastPriority {
        const priority: CastPriority = {};
        classes.forEach(clazz => {
            if ($is.bareObject(clazz.priority)) {
                for (const [k, v] of Object.entries(clazz.priority)) {
                    if (k === 'instance') {
                        if (Array.isArray(v)) {
                            if (priority.instance === undefined) {
                                priority.instance = [];
                            }
                            priority.instance.push(...v);
                        }
                    }
                    else if (priority[k] === undefined) {
                        priority[k] = v;
                    }
                }
            }
        });
        return priority;
    }

    private _process(bbb: CastBase): CastBase {
        const tokenized = bbb.value.tokenized;
        const children = tokenized.children.map((child) => this.hub.discover.build(child));
        const classes = children.map((child) => child.value.clazz);
        const clazz = bbb.value.clazz;

        if (!$is.bareObject(clazz.priority)) {
            clazz.priority = this._buildPriority(classes);
        }
        if (typeof clazz.cast !== 'function') {
            clazz.cast = (value) => this.hub.dto.onCast(clazz, value);
        }
        if (typeof clazz.exact !== 'function') {
            clazz.exact = (value) => this.hub.dto.onExact(clazz, value);
        }
        if (typeof clazz.canBe !== 'function') {
            clazz.canBe = (value) => this.hub.dto.onCanBe(clazz, value);
        }
        if (typeof clazz.doc !== 'function') {
            clazz.doc = (openApi) => this.hub.dto.onDoc(clazz, openApi);
        }

        let classRef: ClassReflectionLike;
        if (!reflectionPool.isRegistered(clazz)) {
            classRef = reflectionPool.registerClass(clazz, undefined, (classRef) => {
                const instanceKeys = [] as Array<string>;
                const staticKeys = [] as Array<string>;
                classes.forEach((childClass) => {
                    let childRef = reflectionPool.get(childClass);
                    if (!childRef) {
                        childRef = reflectionPool.registerClass(childClass);
                    }
                    instanceKeys.push(...classRef.$secure.$copyInstanceProperties(childRef, 'omit', instanceKeys));
                    staticKeys.push(...classRef.$secure.$copyStaticProperties(childRef, 'omit', staticKeys));
                });
            });
        }
        else {
            classRef = reflectionPool.get(clazz);
            const instanceKeys = [] as Array<string>;
            const staticKeys = [] as Array<string>;
            classes.forEach((childClass) => {
                let childRef = reflectionPool.get(childClass);
                if (!childRef) {
                    childRef = reflectionPool.registerClass(childClass);
                }
                instanceKeys.push(...classRef.$secure.$copyInstanceProperties(childRef, 'omit', instanceKeys));
                staticKeys.push(...classRef.$secure.$copyStaticProperties(childRef, 'omit', staticKeys));
            });
        }

        classes.forEach((childClass) => {
            if (reflectionPool.isRegistered(childClass)) {
                classRef.copyDecorators(reflectionPool.get(childClass));
            }
        });
        return bbb;
    }

    // endregion private

    fetch(classRef: ClassReflectionLike, opt: AssignMergeOpt): void {
        this.hub.check.notDecoratedBy(classRef, CastBasic, CastDto, CastGenerics, CastTuple);
        const clazz = classRef.creator as CastClass;
        const tokenized = this.hub.tokenizer.parse(opt.pattern, true);
        const encoded = this.hub.tokenizer.stringify(tokenized);

        this.hub.check.checkDuplicated(clazz, encoded);

        this.hub.check.save(clazz, { tokenized }).value.push('from-merge');
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
        let hasPending = false;
        if (children.some((c) => !c)) {
            if (!this.hub.pending.has(tokenized)) {
                this.hub.pending.queue(tokenized, (t) => this.build(t));
            }
            hasPending = true;
        }
        if (hasPending) {
            return undefined;
        }

        const clazz = class {} as CastClass;
        const name = $name.anonymous('Merge');
        $name.set(clazz, name);
        fqnHandler.clazz(clazz, FQN);

        bbb = this.hub.check.save(clazz, { tokenized });
        this._process(bbb);

        return bbb;
    }
}
