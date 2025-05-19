import {$descriptor, $is, $log, $repo, ClassLike, DeveloperException, Dict} from '@leyyo/common';
import { fqnHandler, nameHandler } from '@leyyo/core';
import { CastUnionLike, CastUnionType } from './index.types';
import { CastApiDocResponse, CastLambda, CastPoolLike } from '../pool';
import {CastExtension, CastPointer} from '../basic';
import { FQN } from '../internal';
import {CastExtensionSign} from "../index.symbols";
import {CastTokenized} from "../tokenizer";

export class CastUnion implements CastUnionLike {
    protected readonly _priorities: Map<CastUnionType, Array<CastUnionType>>;
    private readonly logger = $log.create(CastUnion);

    constructor(protected pool: CastPoolLike) {
        this._priorities = $repo.newMap<CastUnionType, Array<CastUnionType>>(FQN, 'priorities');

        this._priorities.set('number', ['integer', 'number', 'bigint', 'boolean', 'string', 'text']);
        this._priorities.set('boolean', ['boolean', 'string', 'text', 'integer', 'number', 'bigint']);
        this._priorities.set('bigint', ['bigint', 'integer', 'number', 'boolean', 'string', 'text']);
        this._priorities.set('string', ['text', 'string', 'integer', 'number', 'boolean', 'bigint']);
        this._priorities.set('object', ['object', 'array', 'text', 'string', 'integer', 'number', 'bigint']);
        this._priorities.set('array', ['array', 'object', 'text', 'string', 'integer', 'number', 'bigint', 'boolean']);
    }

    private _addLambda(
        basicType: CastUnionType,
        lambda: CastLambda<any>,
        specialLambdas: Map<CastUnionType, Array<CastLambda<any>>>,
    ) {
        if (!specialLambdas.has(basicType)) {
            specialLambdas.set(basicType, []);
        }
        specialLambdas.get(basicType).push(lambda);
    }

    addDiscriminator(clazz: ClassLike, key: string, values: Array<unknown>) {
        //
    }

    buildPointer(tokenized: CastTokenized): CastPointer {
        const encoded = this.pool.tokenizer.stringify(tokenized);
        const base = this.pool.depot.get(encoded);
        if (base) {
            return base.value;
        }
        const pointers = tokenized.children.map((child) => this.pool.discover.buildPointer(child));
        if (pointers.some((p) => !p)) {
            return undefined;
        }
        const extensions = pointers.map(pointer => {
            let extension = ($descriptor.get(pointer, CastExtensionSign)?.value) as CastExtension;
            if (!extension) {
                extension = {names: [], tokenized: {children: []}, hash: undefined};
            }
            return extension;
        });

        const specialLambdas = $repo.newMap<CastUnionType, Array<CastLambda>>(FQN, `union.**${name}`);
        for (const [basicType, possibleTypes] of this._priorities.entries()) {
            if (['object', 'array'].includes(basicType)) {
                continue;
            }
            pointers.forEach((pointer, index) => {
                if (possibleTypes.some(type => extensions[index].names.includes(type))) {
                    this._addLambda(basicType, pointer.cast, specialLambdas);
                }
            });
            pointers.forEach((pointer, index) => {
                if (!possibleTypes.some(type => extensions[index].names.includes(type))) {
                    this._addLambda(basicType, pointer.cast, specialLambdas);
                }
            });
        }
        for (const [basicType, possibleTypes] of this._priorities.entries()) {
            if (!['object', 'array'].includes(basicType)) {
                continue;
            }
            pointers.forEach((pointer, index) => {
                if (possibleTypes.some(type => extensions[index].names.includes(type))) {
                    this._addLambda(basicType, pointer.cast, specialLambdas);
                }
            });
            pointers.forEach((pointer, index) => {
                if (!possibleTypes.some(type => extensions[index].names.includes(type))) {
                    this._addLambda(basicType, pointer.cast, specialLambdas);
                }
            });
        }
        const clz = class AbstractGenerics {
            static priority = { any: 99 };
            static tokenized = tokenized;

            private static _runForType(value: unknown, lambdas: Array<CastLambda<any>>): unknown {
                let firstError: Error;
                for (const lambda of lambdas) {
                    try {
                        const result = lambda(value);
                        if (!$is.empty(result)) {
                            return result;
                        }
                    } catch (e) {
                        if (!firstError) {
                            firstError = e;
                        }
                    }
                }
                if (firstError) {
                    throw firstError;
                }
                return null;
            }

            static cast(value: unknown): unknown {
                if (value === undefined || value === null) {
                    return null;
                }
                const type = typeof value;
                switch (type) {
                    case 'string':
                    case 'number':
                    case 'boolean':
                    case 'bigint':
                        return this._runForType(value, specialLambdas.get(type));
                    case 'object':
                        if (Array.isArray(value)) {
                            return this._runForType(value, specialLambdas.get('array'));
                        } else {
                            return this._runForType(value, specialLambdas.get('object'));
                        }
                    default:
                        throw new DeveloperException({
                            issue: 'generic.invalid-definition',
                            clazz: encoded,
                        }).with(this);
                }
            }

            static is(value: unknown) {
                return pointers.some((p) => (p.is ? p.is(value) : true));
            }

            static doc(target: unknown, propertyKey: PropertyKey, openApi: Dict): CastApiDocResponse {
                return { oneOf: [...pointers.map((p) => p.doc(target, propertyKey, openApi))] };
            }
        } as CastPointer;

        nameHandler.set(clz, encoded);
        fqnHandler.$secure.$setName(clz, encoded);
        this.pool.depot.add(clz);
        return clz;
    }
}
