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


import {TypeDBTransaction} from "../../connection/TypeDBTransaction";
import {RemoteType, Type} from "./Type";
import {RoleType} from "./RoleType";
import {AttributeType} from "./AttributeType";
import {Thing} from "../thing/Thing";
import {Stream} from "../../../common/util/Stream";
import {RequestBuilder} from "../../../common/rpc/RequestBuilder";

export interface ThingType extends Type {

    asRemote(transaction: TypeDBTransaction): RemoteThingType;

}

export interface RemoteThingType extends ThingType, RemoteType {

    asRemote(transaction: TypeDBTransaction): RemoteThingType;

    getSupertype(): Promise<ThingType>;

    getSupertypes(): Stream<ThingType>;

    getSubtypes(): Stream<ThingType>;

    getInstances(): Stream<Thing>;

    setAbstract(): Promise<void>;

    unsetAbstract(): Promise<void>;

    setPlays(role: RoleType): Promise<void>;

    setPlays(role: RoleType, overriddenType: RoleType): Promise<void>;

    setOwns(attributeType: AttributeType): Promise<void>;

    setOwns(attributeType: AttributeType, isKey: boolean): Promise<void>;

    setOwns(attributeType: AttributeType, overriddenType: AttributeType): Promise<void>;

    setOwns(attributeType: AttributeType, overriddenType: AttributeType, isKey: boolean): Promise<void>;

    getPlays(): Stream<RoleType>;

    getOwns(): Stream<AttributeType>;

    getOwns(valueType: AttributeType.ValueType): Stream<AttributeType>;

    getOwns(keysOnly: boolean): Stream<AttributeType>;

    getOwns(valueType: AttributeType.ValueType, keysOnly: boolean): Stream<AttributeType>;

    unsetPlays(role: RoleType): Promise<void>;

    unsetOwns(attributeType: AttributeType): Promise<void>;

}

export namespace ThingType {

    export function proto(thingType: ThingType) {
        return RequestBuilder.Type.ThingType.protoThingType(thingType.getLabel(), Type.encoding(thingType));
    }

}
