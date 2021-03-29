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


import {GraknTransaction} from "../../GraknTransaction";
import {Concept, RemoteConcept} from "../Concept";
import {Stream} from "../../../common/util/Stream";
import {Label} from "../../../common/Label";
import {Type as TypeProto} from "grakn-protocol/common/concept_pb";
import {GraknClientError} from "../../../common/errors/GraknClientError";
import {ErrorMessage} from "../../../common/errors/ErrorMessage";
import BAD_ENCODING = ErrorMessage.Concept.BAD_ENCODING;


export interface Type extends Concept {

    getLabel(): Label;

    isRoot(): boolean;

    asRemote(transaction: GraknTransaction): RemoteType;

}

export interface RemoteType extends Type, RemoteConcept {

    asRemote(transaction: GraknTransaction): RemoteType;

    setLabel(label: string): Promise<void>;

    isAbstract(): Promise<boolean>;

    getSupertype(): Promise<Type>;

    getSupertypes(): Stream<Type>;

    getSubtypes(): Stream<Type>;

}

export namespace Type {

    export function encoding(type: Type): TypeProto.Encoding {
        if (type.isEntityType()) {
            return TypeProto.Encoding.ENTITY_TYPE;
        } else if (type.isRelationType()) {
            return TypeProto.Encoding.RELATION_TYPE;
        } else if (type.isAttributeType()) {
            return TypeProto.Encoding.ATTRIBUTE_TYPE;
        } else if (type.isRoleType()) {
            return TypeProto.Encoding.ROLE_TYPE;
        } else if (type.isThingType()) {
            return TypeProto.Encoding.THING_TYPE;
        } else {
            throw new GraknClientError(BAD_ENCODING);
        }
    }
}