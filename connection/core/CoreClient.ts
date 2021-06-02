/*
 * Copyright (C) 2021 Vaticle
 *
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


import {CoreSession} from "./CoreSession";
import {CoreDatabaseManager} from "./CoreDatabaseManager";
import {TypeDBClient} from "../../api/connection/TypeDBClient";
import {TypeDBOptions} from "../../api/connection/TypeDBOptions";
import {TypeDBSession, SessionType} from "../../api/connection/TypeDBSession";
import {TypeDBClientError} from "../../common/errors/TypeDBClientError";
import {ErrorMessage} from "../../common/errors/ErrorMessage";
import {RequestTransmitter} from "../../stream/RequestTransmitter";
import {TypeDBClient as TypeDBStub} from "typedb-protocol/core/core_service_grpc_pb";
import {ChannelCredentials, closeClient} from "@grpc/grpc-js";
import SESSION_ID_EXISTS = ErrorMessage.Client.SESSION_ID_EXISTS;
import ILLEGAL_CAST = ErrorMessage.Internal.ILLEGAL_CAST;

export class CoreClient implements TypeDBClient {

    private readonly _rpcClient: TypeDBStub;
    private readonly _databases : CoreDatabaseManager;
    private readonly _requestTransmitter: RequestTransmitter;
    private readonly _sessions: {[id: string]: CoreSession};
    private _isOpen : boolean;

    constructor(address : string) {
        this._rpcClient = new TypeDBStub(address, ChannelCredentials.createInsecure());
        this._databases = new CoreDatabaseManager(this._rpcClient);
        this._requestTransmitter = new RequestTransmitter();
        this._sessions = {};
        this._isOpen = true;
    }

    databases(): CoreDatabaseManager {
        return this._databases;
    }

    async session(database: string, type: SessionType, options?: TypeDBOptions): Promise<TypeDBSession> {
        if (!options) options = TypeDBOptions.core();
        const session = new CoreSession(database, type, options, this);
        await session.open();
        if (this._sessions[session.sessionId()]) throw new TypeDBClientError(SESSION_ID_EXISTS.message(session.sessionId()));
        this._sessions[session.sessionId()] = session;
        return session;
    }

    close(): void {
        if (this._isOpen) {
            this._isOpen = false;
            Object.values(this._sessions).forEach(s => s.close());
            this._requestTransmitter.close();
            closeClient(this._rpcClient);
        }
    }

    isOpen(): boolean {
        return this._isOpen;
    }

    isCluster(): boolean {
        return false;
    }

    asCluster(): TypeDBClient.Cluster {
        throw new TypeDBClientError(ILLEGAL_CAST.message(this.constructor.toString(), "ClusterClient"));
    }

    rpc() : TypeDBStub {
        return this._rpcClient;
    }

    transmitter(): RequestTransmitter {
        return this._requestTransmitter;
    }

    closedSession(session : CoreSession) : void {
        delete this._sessions[session.sessionId()];
    }

}