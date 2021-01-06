import {ConceptMap} from "./ConceptMap";
import {Concept} from "../Concept";
import AnswerProto from "grakn-protocol/protobuf/answer_pb";
import {ThingImpl} from "../thing/impl/ThingImpl";
import {TypeImpl} from "../type/impl/TypeImpl";

export class ConceptMapGroup {
    private readonly _owner: Concept;
    private readonly _conceptMaps: ConceptMap[];

    constructor(owner: Concept, conceptMaps: ConceptMap[]) {
        this._owner = owner;
        this._conceptMaps = conceptMaps;
    }

    public static of (res: AnswerProto.ConceptMapGroup): ConceptMapGroup {
        let concept: Concept;
        if (res.getOwner().hasThing()) concept = ThingImpl.of(res.getOwner().getThing());
        else concept = TypeImpl.of(res.getOwner().getType());
        return new ConceptMapGroup(concept, res.getConceptMapsList().map((ans) => ConceptMap.of(ans)) as ConceptMap[])
    }

    owner(): Concept {
        return this._owner;
    }

    conceptMaps(): ConceptMap[] {
        return this._conceptMaps;
    }
}