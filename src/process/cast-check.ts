import { $dev, $log, Func } from '@leyyo/common';
import { ClassReflectionLike, Fqn, fqnHandler } from '@leyyo/core';

import { CastAnalyseType, CastCheckLike, CastSaveOpt, CastTokenized } from './index.types';
import { CastBase, CastClass, CastHubLike, CastTag, CastValue } from '../hub';
import { FQN } from '../internal';

@Fqn(FQN)
export class CastCheck implements CastCheckLike {
    // region properties
    private readonly logger = $log.create(CastCheck);
    // endregion properties

    constructor(private hub: CastHubLike) {}

    notDecoratedBy(classRef: ClassReflectionLike, ...functions: Array<Func>): void {
        functions.forEach((fn) => {
            if (classRef.hasDecorator(fn)) {
                throw $dev.developerError2(FQN, 100, {
                    message: `Class should not been decorated by ${fqnHandler.get(fn)}`,
                    clazz: classRef.description,
                });
            }
        });
    }

    getOrCreate(clazz: CastClass, tokenized?: CastTokenized): CastBase {
        const bbb = this.hub.depot.get(clazz);
        if (bbb) {
            return bbb;
        }
        if (!tokenized) {
            tokenized = this.hub.tokenizer.parse(clazz, true);
        }
        return this.hub.check.save(clazz, { tokenized });
    }

    checkDuplicated(clazz: CastClass, encoded?: string): void {
        if (this.hub.depot.has(clazz)) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Duplicated cast class',
                where: `${FQN}.CastFetch`,
                clazz,
            });
        }
        if (encoded && this.hub.depot.has(encoded)) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Duplicated cast class',
                where: `${FQN}.CastFetch`,
                clazz,
                encoded,
            });
        }
    }

    save(clazz: CastClass, opt: CastSaveOpt): CastBase {
        const encoded = this.hub.tokenizer.stringify(opt.tokenized);
        if (!Array.isArray(opt.aliases)) {
            opt.aliases = [];
        }
        opt.aliases.push(encoded);
        const value = {
            clazz,
            tokenized: opt.tokenized,
            tags: [],
            naming: opt.naming ?? fqnHandler.$secure.$get(clazz),
            push(tag: CastTag): CastValue {
                if (tag && !value.tags.includes(tag)) {
                    value.tags.push(tag);
                }
                return value;
            },
        } as CastValue;
        const bbb = this.hub.depot.add(value, ...opt.aliases);
        this.logger.debug(`${clazz.name} is registered as ${encoded}`);
        return bbb;
    }

    analyse(clazz: CastClass): CastAnalyseType {
        if (!['function', 'object'].includes(typeof clazz)) {
            return undefined;
        }
        if (typeof clazz.castGen === 'function') {
            return 'generics';
        }
        if (typeof clazz.cast === 'function') {
            return 'basic';
        }
        return undefined;
    }
}
