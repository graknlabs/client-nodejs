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

import { ErrorMessage, GraknClient, GraknClientError } from "../dependencies_internal";
import { GraknClient as GraknGrpc } from "grakn-protocol/protobuf/grakn_grpc_pb"
import DatabaseProto from "grakn-protocol/protobuf/database_pb";

export class DatabaseRPC implements GraknClient.Database {

    private readonly _name: string;
    private readonly _grpcClient: GraknGrpc;

    constructor(grpcClient: GraknGrpc, name: string) {
        this._name = name;
        this._grpcClient = grpcClient;
    }

    name(): string {
        return this._name;
    }

    delete(): Promise<void> {
        if (!this._name) throw new GraknClientError(ErrorMessage.Client.MISSING_DB_NAME.message());
        const req = new DatabaseProto.Database.Delete.Req().setName(this._name);
        return new Promise((resolve, reject) => {
            this._grpcClient.database_delete(req, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}
