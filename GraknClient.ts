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

import { GraknOptions, ConceptManager, QueryManager, LogicManager, ClientRPC } from "./dependencies_internal";

export interface GraknClient {
    session(databaseName: string, type: GraknClient.SessionType, options?: GraknOptions): Promise<GraknClient.Session>;

    databases(): GraknClient.DatabaseManager;

    isOpen(): boolean;

    close(): void;
}
export namespace GraknClient {

    export const DEFAULT_ADDRESS = "localhost:1729";

    export function core(address: string = DEFAULT_ADDRESS): GraknClient {
        return new ClientRPC(address);
    }

    export interface DatabaseManager {
        contains(name: string): Promise<boolean>;

        create(name: string): Promise<void>;

        delete(name: string): Promise<void>;

        all(): Promise<string[]>;
    }

    export interface Session {
        transaction(type: TransactionType, options?: GraknOptions): Promise<Transaction>;

        type(): SessionType;

        isOpen(): boolean;

        close(): Promise<void>;

        database(): string;
    }

    export enum SessionType {
        DATA,
        SCHEMA,
    }

    export interface Transaction {
        type(): TransactionType;

        isOpen(): boolean;

        concepts(): ConceptManager;

        logic(): LogicManager;

        query(): QueryManager;

        commit(): Promise<void>;

        rollback(): Promise<void>;

        close(): Promise<void>;
    }

    export enum TransactionType {
        READ,
        WRITE,
    }
}
