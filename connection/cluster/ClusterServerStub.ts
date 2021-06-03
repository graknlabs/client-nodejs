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

import {TypeDBStub} from "../../common/rpc/TypeDBStub";
import {TypeDBClusterClient} from "typedb-protocol/cluster/cluster_service_grpc_pb";
import {Metadata, credentials, CallCredentials, ChannelCredentials} from "@grpc/grpc-js";
import {TypeDBClient} from "typedb-protocol/core/core_service_grpc_pb";
import {TypeDBCredential} from "../../api/connection/TypeDBCredential";
import {ServerManager} from "typedb-protocol/cluster/cluster_server_pb";
import {TypeDBClientError} from "../../common/errors/TypeDBClientError";
import {ClusterUser, ClusterUserManager} from "typedb-protocol/cluster/cluster_user_pb";
import {ClusterDatabaseManager} from "typedb-protocol/cluster/cluster_database_pb";
import * as fs from "fs";

export class ClusterServerStub extends TypeDBStub {

    private _clusterStub: TypeDBClusterClient;

    constructor(stub: TypeDBClient, clusterStub: TypeDBClusterClient) {
        super(stub);
        this._clusterStub = clusterStub;
    }

    serversAll(req: ServerManager.All.Req): Promise<ServerManager.All.Res> {
        return new Promise<ServerManager.All.Res>((resolve, reject) => {
            this._clusterStub.servers_all(req, (err, res) => {
                if (err) reject(new TypeDBClientError(err));
                else resolve(res);
            });
        });
    }

    usersAll(req: ClusterUserManager.All.Req): Promise<ClusterUserManager.All.Res> {
        return new Promise<ClusterUserManager.All.Res>((resolve, reject) => {
            this._clusterStub.users_all(req, (err, res) => {
                if (err) reject(new TypeDBClientError(err));
                else resolve(res);
            });
        });
    }

    usersContains(req: ClusterUserManager.Contains.Req): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            this._clusterStub.users_contains(req, (err, res) => {
                if (err) reject(new TypeDBClientError(err));
                else resolve(res.getContains());
            })
        });
    }

    userCreate(req: ClusterUserManager.Create.Req): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this._clusterStub.users_create(req, (err, res) => {
                if (err) reject(new TypeDBClientError(err));
                else resolve();
            })
        });
    }

    userDelete(req: ClusterUser.Delete.Req) {
        return new Promise<ClusterUser.Delete.Res>((resolve, reject) => {
            this._clusterStub.user_delete(req, (err, res) => {
                if (err) reject(new TypeDBClientError(err));
                else resolve();
            })
        });
    }

    databasesClusterGet(req: ClusterDatabaseManager.Get.Req): Promise<ClusterDatabaseManager.Get.Res> {
        return new Promise<ClusterDatabaseManager.Get.Res>((resolve, reject) => {
            this._clusterStub.databases_get(req, (err, res) => {
                if (err) reject(new TypeDBClientError(err));
                else resolve();
            })
        });
    }

    databasesClusterAll(req: ClusterDatabaseManager.All.Req): Promise<ClusterDatabaseManager.All.Res> {
        return new Promise<ClusterDatabaseManager.All.Res>((resolve, reject) => {
            this._clusterStub.databases_all(req, (err, res) => {
                if (err) reject(new TypeDBClientError(err));
                else resolve();
            })
        });
    }
}

export namespace ClusterServerStub {

    export function create(address: string, credential: TypeDBCredential) {
        const metaCallback = (_params: any, callback: any) => {
            const meta = new Metadata();
            meta.add('username', credential.username());
            meta.add('password', credential.password());
            callback(null, meta);
        }
        const callCreds = CallCredentials.createFromMetadataGenerator(metaCallback);

        let stubCredentials;
        if (credential.tlsEnabled()) {
            if (credential.tlsRootCAPath() != null) {
                const rootCert = fs.readFileSync(credential.tlsRootCAPath());
                stubCredentials = credentials.combineChannelCredentials(ChannelCredentials.createSsl(rootCert), callCreds);
            } else {
                stubCredentials = credentials.combineChannelCredentials(ChannelCredentials.createSsl(), callCreds);
            }
        } else {
            stubCredentials = credentials.combineChannelCredentials(ChannelCredentials.createInsecure(), callCreds);
        }

        return new ClusterServerStub(
            new TypeDBClient(address, stubCredentials),
            new TypeDBClusterClient(address, stubCredentials)
        )
    }

}