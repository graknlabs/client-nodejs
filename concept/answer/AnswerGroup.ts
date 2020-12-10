/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {
    Answer,
    Concept,
    Grakn, ThingImpl, TypeImpl,
} from "../../dependencies_internal"
import Transaction = Grakn.Transaction;
import AnswerProto from "graknlabs-protocol/protobuf/answer_pb";



export class AnswerGroup<T> {
    private readonly _owner: Concept;
    private readonly _answers: T[];

    constructor(owner: Concept, answers: T[]) {
        this._owner = owner;
        this._answers = answers;
    }

    public static of (transaction: Transaction, res: AnswerProto.AnswerGroup): AnswerGroup<Answer> {
        let concept: Concept;
        if (res.getOwner().hasThing()) concept = ThingImpl.of(res.getOwner().getThing());
        else concept = TypeImpl.of(res.getOwner().getType());
        return new AnswerGroup<Answer>(concept, res.getAnswersList().map((ans) => Answer.of(transaction, ans)) as Answer[])
    }

    owner(): Concept {
        return this._owner;
    }

    answers(): T[] {
        return this._answers;
    }
}
