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

import {ClusterClient} from "./ClusterClient";
import {ClusterUserManager, FailsafeTask} from "../../dependencies_internal";
import {RequestBuilder} from "../../common/rpc/RequestBuilder";
import {User} from "../../api/connection/user/User";
import {Database} from "../../api/connection/database/Database";

export class ClusterUser implements User {

    private _client: ClusterClient;
    private _name: string;

    constructor(client: ClusterClient, name: string) {
        this._client = client;
        this._name = name;
    }

    async password(password: string): Promise<void> {
        const failsafeTask = new ClusterUserFailsafeTask(this._client, (replica) => {
            return this._client.stub(replica.address()).userPassword(RequestBuilder.Cluster.User.passwordReq(this.name(), password));
        });
        await failsafeTask.runPrimaryReplica();
    }

    async delete(): Promise<void> {
        const failsafeTask = new ClusterUserFailsafeTask(this._client, (replica) => {
            return this._client.stub(replica.address()).userDelete(RequestBuilder.Cluster.User.deleteReq(this.name()));
        });
        await failsafeTask.runPrimaryReplica();
    }

    name(): string {
        return this._name;
    }
}

class ClusterUserFailsafeTask<T> extends FailsafeTask<T> {

    private readonly _task: (replica: Database.Replica) => Promise<T>;

    constructor(client: ClusterClient, task: (replica: Database.Replica) => Promise<T>) {
        super(client, ClusterUserManager._SYSTEM_DB);
        this._task = task;
    }

    run(replica: Database.Replica): Promise<T> {
        return this._task(replica);
    }

}
