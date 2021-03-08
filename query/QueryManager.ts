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

import { TransactionRPC, GraknOptions, OptionsProtoBuilder, Stream, ConceptMap, Numeric, ConceptMapGroup,
    NumericGroup } from "../dependencies_internal";
import QueryProto from "grakn-protocol/protobuf/query_pb";
import Query = QueryProto.Query;
import TransactionProto from "grakn-protocol/protobuf/transaction_pb";
import Transaction = TransactionProto.Transaction;

export class QueryManager {
    private readonly _transactionRPC: TransactionRPC;
    constructor (transaction: TransactionRPC) {
        this._transactionRPC = transaction;
    }

    public match(query: string, options?: GraknOptions): Stream<ConceptMap> {
        const matchQuery = new Query.Req().setMatchReq(new Query.Match.Req().setQuery(query));
        return this.iterateQuery(matchQuery, options ? options : GraknOptions.core(),
            (res: Transaction.Res) => res.getQueryRes().getMatchRes().getAnswersList().map(ConceptMap.of));
    }

    public matchAggregate(query: string, options?: GraknOptions): Promise<Numeric> {
        const matchAggregateQuery = new Query.Req().setMatchAggregateReq(new Query.MatchAggregate.Req().setQuery(query));
        return this.runQuery(matchAggregateQuery, options ? options : GraknOptions.core(),
            (res: Transaction.Res) => Numeric.of(res.getQueryRes().getMatchAggregateRes().getAnswer()));
    }

    public matchGroup(query: string, options?: GraknOptions): Stream<ConceptMapGroup> {
        const matchGroupQuery = new Query.Req().setMatchGroupReq(new Query.MatchGroup.Req().setQuery(query));
        return this.iterateQuery(matchGroupQuery, options ? options : GraknOptions.core(),
            (res: Transaction.Res) => res.getQueryRes().getMatchGroupRes().getAnswersList().map(ConceptMapGroup.of));
    }

    public matchGroupAggregate(query: string, options?: GraknOptions): Stream<NumericGroup> {
        const matchGroupAggregateQuery = new Query.Req().setMatchGroupAggregateReq(
            new Query.MatchGroupAggregate.Req().setQuery(query));
        return this.iterateQuery(matchGroupAggregateQuery, options ? options : GraknOptions.core(),
            (res: Transaction.Res) => res.getQueryRes().getMatchGroupAggregateRes().getAnswersList().map(NumericGroup.of));
    }

    public insert(query: string, options?: GraknOptions): Stream<ConceptMap> {
        const insertQuery = new Query.Req().setInsertReq(new Query.Insert.Req().setQuery(query));
        return this.iterateQuery(insertQuery, options ? options : GraknOptions.core(),
            (res: Transaction.Res) => res.getQueryRes().getInsertRes().getAnswersList().map(ConceptMap.of));
    }

    public delete(query: string, options?: GraknOptions): Promise<void> {
        const deleteQuery = new Query.Req().setDeleteReq(new Query.Delete.Req().setQuery(query));
        return this.runQuery(deleteQuery, options ? options : GraknOptions.core(), () => null);
    }

    public update(query: string, options?: GraknOptions): Stream<ConceptMap> {
        const updateQuery = new Query.Req().setUpdateReq(new Query.Update.Req().setQuery(query));
        return this.iterateQuery(updateQuery, options ? options : GraknOptions.core(),
            (res: Transaction.Res) => res.getQueryRes().getUpdateRes().getAnswersList().map(ConceptMap.of));
    }

    public define(query: string, options?: GraknOptions): Promise<void> {
        const defineQuery = new Query.Req().setDefineReq(new Query.Define.Req().setQuery(query));
        return this.runQuery(defineQuery, options ? options : GraknOptions.core(), () => null);
    }

    public undefine(query: string, options?: GraknOptions): Promise<void> {
        const undefineQuery = new Query.Req().setUndefineReq(new Query.Undefine.Req().setQuery(query));
        return this.runQuery(undefineQuery, options ? options : GraknOptions.core(), () => null);
    }

    private iterateQuery<T>(request: Query.Req, options: GraknOptions, responseReader: (res: Transaction.Res) => T[]): Stream<T> {
        const transactionRequest = new Transaction.Req()
            .setQueryReq(request.setOptions(OptionsProtoBuilder.options(options)));
        return this._transactionRPC.stream(transactionRequest, responseReader);
    }

    private async runQuery<T>(request: Query.Req, options: GraknOptions, mapper: (res: Transaction.Res) => T): Promise<T> {
        const transactionRequest = new Transaction.Req()
            .setQueryReq(request.setOptions(OptionsProtoBuilder.options(options)));
        return this._transactionRPC.execute(transactionRequest, mapper);
    }
}
