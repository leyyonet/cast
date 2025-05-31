import { $descriptor, $dev, $err, $is, $log, $repo, Dict, Func, PropDescriptor } from '@leyyo/common';
import { DecoInstanceLike, fqnHandler, PropertyReflectionLike } from '@leyyo/core';

import { CastRefactorLike } from './index.types';
import { FQN } from '../internal';
import { CastOpt } from '../decorators';
import { CastValueSign } from '../index.symbols';
import { CastClass, CastLambda } from '../shared';
import { CastHubLike } from '../hub';

export class CastRefactor implements CastRefactorLike {
    private readonly logger = $log.create(CastRefactor);
    private readonly methodLambda = $repo.newMap<PropertyReflectionLike, Array<CastLambda>>(FQN, 'methodLambda');
    private readonly methodClasses = $repo.newMap<PropertyReflectionLike, Array<CastClass>>(FQN, 'methodClasses');

    constructor(private hub: CastHubLike) {}

    property(ins: DecoInstanceLike, opt: CastOpt): void {
        const ref = ins.asField;
        if (!opt.type) {
            opt.type = ref.type;
        }

        const clazz = this.hub.discover.find(opt.type, () => $dev.opt({
            kind: 'basic',
            desc: ins.description,
            where: `${FQN}.CastRefactor`,
            method: 'property',
        }));

        if (clazz !== ref.type) {
            ref.$secure.$setType(clazz as Func);
        }
        if (opt.weak) {
            return;
        }
        let def = undefined;
        let desc: PropertyDescriptor;
        if (ref.isInstance) {
            desc = Object.getOwnPropertyDescriptor(ref.clazz.body, ref.name);
        } else {
            desc = Object.getOwnPropertyDescriptor(ref.clazz, ref.name);
        }
        if (desc) {
            def = desc.value;
        }
        if (ref.isInstance) {
            delete ref.clazz.body[ref.name];
        } else {
            delete ref.clazz[ref.name];
        }
        let emptyFn: Func;
        if ($is.object(def)) {
            emptyFn = () => {
                return { ...def };
            };
        } else if (Array.isArray(def)) {
            emptyFn = () => {
                return [...def];
            };
        } else {
            emptyFn = () => def;
        }
        const get = function (): unknown {
            const rec = $descriptor.getValue<Dict>(this, CastValueSign);
            if (rec) {
                return rec[ref.name];
            }
            return undefined;
        };
        const set = function (value: unknown): void {
            let desc = $descriptor.get<Dict>(this, CastValueSign);
            if (!desc) {
                desc = {
                    value: {},
                } as PropDescriptor<Dict>;
                $descriptor.save(this, CastValueSign, desc.value);
            }
            try {
                desc.value[ref.name] = value !== undefined ? clazz.cast(value) : emptyFn();
            } catch (e) {
                const err = $err.build(e);
                err.params['field'] = ref.name;
                throw e;
            }
        };
        if (ref.isInstance) {
            Object.defineProperty(ref.clazz.body, ref.name, {
                configurable: true,
                enumerable: true,
                get,
                set,
            });
        } else {
            Object.defineProperty(ref.clazz, ref.name, {
                configurable: true,
                enumerable: true,
                get,
                set,
            });
        }
        this.logger.deploy.$info(FQN, 100, {
            message: 'Field casted',
            desc: ins.description,
            clazz: fqnHandler.get(clazz),
        });
    }

    parameter(ins: DecoInstanceLike, opt: CastOpt): void {
        const ref = ins.asParameter;

        if (!opt.type) {
            opt.type = ref.type;
        }
        const clazz = this.hub.discover.find(opt.type, () => $dev.opt({
            message: 'Invalid cast class',
            kind: 'basic',
            desc: ins.description,
            where: `${FQN}.CastRefactor`,
            method: 'parameter',
        }));

        if (!this.methodClasses.has(ref.property)) {
            this.methodClasses.set(ref.property, []);
            ref.property.listParameters().forEach((_p, index) => {
                this.methodClasses.get(ref.property)[index] = undefined;
            });
        }
        this.methodClasses.get(ref.property)[ref.index] = clazz;

        if (ref.type !== clazz) {
            ref.$secure.$setType(clazz as Func);
        }

        if (opt.weak) {
            return;
        }

        if (!this.methodLambda.has(ref.property)) {
            const lambdaList = [];
            ref.property.listParameters().forEach((_p) => {
                lambdaList.push((v) => v);
            });
            this.methodLambda.set(ref.property, lambdaList);
        }
        this.methodLambda.get(ref.property)[ref.index] = clazz.cast;
        this.logger.deploy.$info(FQN, 100, {
            message: 'Parameter casted',
            desc: ins.description,
            clazz: fqnHandler.get(clazz),
        });
    }

    hasMethod(ref: PropertyReflectionLike): boolean {
        return this.methodLambda.has(ref);
    }

    runForMethod(ref: PropertyReflectionLike, values: Array<any>): Array<any> {
        const lambdaList = this.methodLambda.get(ref);
        if (!lambdaList) {
            return values;
        }
        return lambdaList.map((lambda, index) => lambda(values[index]));
    }
}
