import { CastName } from '../hub';

export interface AssignTypeOpt {
    main?: string;
}

export interface CastAliasOpt {
    aliases: Array<string>;
}

export interface AssignDtoOpt {
    field?: string;
    values?: Array<unknown>;
}

export interface AssignGenericsOpt {
    min: number;
    max: number;
}

export interface AssignTupleOpt {
    pattern: string;
}

export interface AssignMergeOpt {
    pattern: string;
}

export interface AssignUnionOpt {
    pattern: string;
}

export interface CastOpt {
    type: CastName;
    weak?: boolean;
}

export interface GenericsIndexOpt {
    index: number;
    def?: CastName;
}
