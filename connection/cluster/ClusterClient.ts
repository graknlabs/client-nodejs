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


import {FailsafeTask} from "./FailsafeTask";
import {ClusterSession} from "./ClusterSession";
import {ClusterDatabase} from "./ClusterDatabase";
import {ClusterDatabaseManager} from "./ClusterDatabaseManager";
import {CoreClient} from "../core/CoreClient";
import {TypeDBClient} from "../../api/connection/TypeDBClient";
import {TypeDBClusterOptions, TypeDBOptions} from "../../api/connection/TypeDBOptions";
import {Database} from "../../api/connection/database/Database";
import {SessionType} from "../../api/connection/TypeDBSession";
import {ErrorMessage} from "../../common/errors/ErrorMessage";
import {TypeDBClientError} from "../../common/errors/TypeDBClientError";
import {ServerManager} from "typedb-protocol/cluster/cluster_server_pb";
import {ChannelCredentials} from "@grpc/grpc-js";
import CLUSTER_UNABLE_TO_CONNECT = ErrorMessage.Client.CLUSTER_UNABLE_TO_CONNECT;
import {ClusterServerStub} from "./ClusterServerStub";
import {RequestBuilder} from "../../common/rpc/RequestBuilder";

export class ClusterClient implements TypeDBClient.Cluster {

    private _coreClients: { [serverAddress: string]: CoreClient };
    private _clusterStubs: { [serverAddress: string]: ClusterServerStub };
    private _databaseManagers: ClusterDatabaseManager;
    private _clusterDatabases: { [db: string]: ClusterDatabase };
    private _isOpen: boolean;

    async open(addresses: string[]): Promise<this> {
        const serverAddresses = await this.fetchClusterServers(addresses);
        this._coreClients = {}
        serverAddresses.forEach((addr) => {
            this._coreClients[addr] = new CoreClient(addr);
        });
        this._clusterStubs = {};
        serverAddresses.forEach((addr) => {
            this._clusterStubs[addr] = new TypeDBClusterClient(addr, ChannelCredentials.createInsecure());
        });

        this._databaseManagers = new ClusterDatabaseManager(this);
        this._clusterDatabases = {};
        this._isOpen = true;
        return this;
    }

    session(database: string, type: SessionType, options: TypeDBClusterOptions = TypeDBOptions.cluster()): Promise<ClusterSession> {
        if (options.readAnyReplica) {
            return this.sessionAnyReplica(database, type, options);
        } else {
            return this.sessionPrimaryReplica(database, type, options);
        }
    }

    private sessionPrimaryReplica(database: string, type: SessionType, options: TypeDBClusterOptions): Promise<ClusterSession> {
        return new OpenSessionFailsafeTask(database, type, options, this).runPrimaryReplica();
    }

    private sessionAnyReplica(database: string, type: SessionType, options: TypeDBClusterOptions): Promise<ClusterSession> {
        return new OpenSessionFailsafeTask(database, type, options, this).runAnyReplica();
    }

    databases(): ClusterDatabaseManager {
        return this._databaseManagers;
    }

    isOpen(): boolean {
        return this._isOpen;
    }

    close(): void {
        if (this._isOpen) {
            this._isOpen = false;
            Object.values(this._coreClients).forEach(client => client.close());
        }
    }

    isCluster(): boolean {
        return true;
    }

    clusterDatabases(): { [db: string]: ClusterDatabase } {
        return this._clusterDatabases;
    }

    clusterMembers(): string[] {
        return Object.keys(this._coreClients);
    }

    coreClient(address: string): TypeDBClient {
        return this._coreClients[address];
    }

    coreClients() {
        return this._coreClients;
    }

    stub(address: string): ClusterServerStub {
        return this._clusterStubs[address];
    }

    private async fetchClusterServers(addresses: string[]): Promise<string[]> {
        for (const address of addresses) {
            const client = new CoreClient(address);
            try {
                console.info(`Fetching list of cluster servers from ${address}...`);
                const clusterStub = ClusterServerStub.create(address, credential);
                const res = await clusterStub.serversAll(RequestBuilder.Cluster.ServerManager.allReq());
                const members = res.getServersList().map(x => x.getAddress());
                console.info(`The cluster servers are ${members}`);
                return members;
            } catch (e) {
                console.error(`Fetching cluster servers from ${address} failed.`, e);
            } finally {
                client.close();
            }
        }
        throw new TypeDBClientError(CLUSTER_UNABLE_TO_CONNECT.message(addresses.join(",")));
    }

    asCluster(): TypeDBClient.Cluster {
        return this;
    }

}

class OpenSessionFailsafeTask extends FailsafeTask<ClusterSession> {
    private readonly _type: SessionType;
    private readonly _options: TypeDBClusterOptions;

    constructor(database: string, type: SessionType, options: TypeDBClusterOptions, client: ClusterClient) {
        super(client, database);
        this._type = type;
        this._options = options;
    }

    run(replica: Database.Replica): Promise<ClusterSession> {
        const session = new ClusterSession(this.client, replica.address());
        return session.open(replica.address(), this.database, this._type, this._options);
    }
}
