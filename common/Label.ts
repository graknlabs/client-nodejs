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

export class Label {
    private _scope: string;
    private _name: string;

    constructor(scope: string, label: string) {
        this._scope = scope;
        this._name = label;
    }

    scope(): string {
        return this._scope;
    }

    name(): string {
        return this._name;
    }

    scopedName(): string {
        return this._scope == null ? this._name : `${this._scope}:${this._name}`;
    }

    toString() {
        return this.scopedName();
    }

    equals(that: Label) {
        return this._scope === that._scope && this._name === that._name;
    }
}

export namespace Label {

    export function of(name: string) {
        return new Label(null, name);
    }

    export function scoped(scope: string, name: string) {
        return new Label(scope, name);
    }

}