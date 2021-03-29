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


import {BatchDispatcher} from "./RequestTransmitter";
import {ResponseCollector} from "./ResponseCollector";
import {Transaction} from "grakn-protocol/common/transaction_pb";
import {GraknClientError} from "../common/errors/GraknClientError";
import {ErrorMessage} from "../common/errors/ErrorMessage";
import {RequestBuilder} from "../common/rpc/RequestBuilder";
import ResCase = Transaction.ResPart.ResCase;
import MISSING_RESPONSE = ErrorMessage.Client.MISSING_RESPONSE;
import UNKNOWN_STREAM_STATE = ErrorMessage.Client.UNKNOWN_STREAM_STATE;


export class ResponsePartIterator implements AsyncIterable<Transaction.ResPart> {

    private readonly _requestId: string;
    private readonly _dispatcher: BatchDispatcher;
    private readonly _responseCollector: ResponseCollector.ResponseQueue<Transaction.ResPart>;
    private _next: Transaction.ResPart;

    constructor(requestId: string, responseCollector: ResponseCollector.ResponseQueue<Transaction.ResPart>,
                dispatcher: BatchDispatcher) {
        this._requestId = requestId;
        this._dispatcher = dispatcher;
        this._responseCollector = responseCollector;
        this._next = null;
    }

    async* [Symbol.asyncIterator](): AsyncIterator<Transaction.ResPart, any, undefined> {
        while (true) {
            const next = await this.next()
            if (next != null) yield next;
            else break;
        }
    }

    async next(): Promise<Transaction.ResPart> {
        const res = await this._responseCollector.take();
        switch (res.getResCase()) {
            case ResCase.RES_NOT_SET:
                throw new GraknClientError(MISSING_RESPONSE.message(this._requestId));
            case ResCase.STREAM_RES_PART :
                switch (res.getStreamResPart().getState()) {
                    case Transaction.Stream.State.DONE:
                        return null;
                    case Transaction.Stream.State.CONTINUE:
                        this._dispatcher.dispatch(RequestBuilder.Transaction.streamReq(this._requestId))
                        return this.next();
                    default:
                        throw new GraknClientError(UNKNOWN_STREAM_STATE.message(res.getStreamResPart()));
                }
            default:
                return res;
        }
    }


}