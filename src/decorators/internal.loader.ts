import {AssignGenerics} from "./assign-generics";
import {AssignTuple} from "./assign-tuple";
import {AssignType} from "./assign-type";
import {AssignUnion} from "./assign-union";
import {Cast} from "./cast";
import {Discriminator} from "./discriminator";
import {Dto} from "./dto";

export const $$castDecorators = [
    AssignGenerics, AssignTuple, AssignType, AssignUnion,
    Cast, Discriminator, Dto
];
