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


import {ThingTypeImpl} from "./ThingTypeImpl";
import {Type as TypeProto} from "grakn-protocol/common/concept_pb";
import {RelationType} from "../../api/concept/type/RelationType";
import {EntityTypeImpl} from "./EntityTypeImpl";

export class RelationTypeImpl extends ThingTypeImpl implements RelationType {

    constructor(label: string, isRoot: boolean) {
        super(label, isRoot);
    }

}

export namespace RelationTypeImpl {

    export function of(relationTypeProto: TypeProto) {
        return new EntityTypeImpl(relationTypeProto.getLabel(), relationTypeProto.getRoot());
    }

}