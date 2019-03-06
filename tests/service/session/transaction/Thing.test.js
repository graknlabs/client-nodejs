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

const env = require('../../../support/GraknTestEnvironment');
let session;
let tx;

beforeAll(async () => {
    session = await env.session();
});

afterAll(async () => {
    await env.tearDown();
});

beforeEach(async () => {
    tx = await session.transaction().write();
})

afterEach(() => {
    tx.close();
});

describe("Thing methods", () => {

    test("isInferred", async () => {
        const personType = await tx.putEntityType('person');
        const thing = await personType.create();
        expect(await thing.isInferred()).toBeFalsy();
    });

    test("type", async () => {
        const personType = await tx.putEntityType('person');
        const thing = await personType.create();
        const type = await thing.type();
        expect(type.id).toBe(personType.id);
        expect(type.isType()).toBeTruthy();
    });

    test("relations", async () => {
        const relationType = await tx.putRelationType('parenthood');
        const relation = await relationType.create();
        const parentRole = await tx.putRole('parent');
        const personType = await tx.putEntityType('person');
        const parent = await personType.create();
        await relation.assign(parentRole, parent);
        const rels = await (await parent.relations()).collect();
        expect(rels.length).toBe(1);
        expect(rels[0].id).toBe(relation.id);
    });

    test("relations() filtered by role", async () => {
        const personType = await tx.putEntityType('person');
        const person = await personType.create();

        //First relation type
        const relationType = await tx.putRelationType('parenthood');
        const parenthoodRel1 = await relationType.create();
        const parentRole = await tx.putRole('parent');
        await parenthoodRel1.assign(parentRole, person);

        const parenthoodRel2 = await relationType.create();
        await parenthoodRel2.assign(parentRole, person);

        const parentRelations = await (await person.relations(parentRole)).collect();
        expect(parentRelations.length).toBe(2);

        //Second relation type
        const relationType2 = await tx.putRelationType('employment');
        const employmentRel = await relationType2.create();
        const employerRole = await tx.putRole('employer');
        await employmentRel.assign(employerRole, person);


        const employerRelations = await (await person.relations(employerRole)).collect();
        expect(employerRelations.length).toBe(1);
        expect(employerRelations[0].id).toBe(employmentRel.id);
    });

    test("roles", async () => {
        const relationType = await tx.putRelationType('parenthood');
        const relation = await relationType.create();
        const parentRole = await tx.putRole('parent');
        const personType = await tx.putEntityType('person');
        const parent = await personType.create();
        await relation.assign(parentRole, parent);
        const roles = await (await parent.roles()).collect();
        expect(roles.length).toBe(1);
        expect(roles[0].id).toBe(parentRole.id);
    });

    test("has/unhas/get attributes", async () => {
        const personType = await tx.putEntityType('person');
        const attrType = await tx.putAttributeType('name', env.dataType().STRING);
        await personType.has(attrType);
        const person = await personType.create();
        const name = await attrType.create('Marco');
        await person.has(name);
        const attrs = await (await person.attributes()).collect();
        expect(attrs.length).toBe(1);
        expect(attrs[0].id).toBe(name.id);
        await person.unhas(name);
        const emptyAttrs = await (await person.attributes()).collect();
        expect(emptyAttrs.length).toBe(0);
    });

    test("attributes(...AttributeType)", async () => {
        const personType = await tx.putEntityType('person');
        const attrType = await tx.putAttributeType('name', env.dataType().STRING);
        const attrMarriedType = await tx.putAttributeType('married', env.dataType().BOOLEAN);
        const whateverType = await tx.putAttributeType('whatever', env.dataType().FLOAT);
        await personType.has(attrType);
        await personType.has(attrMarriedType);
        const person = await personType.create();
        const notMarried = await attrMarriedType.create(false);
        const name = await attrType.create('Marco');
        await person.has(name);
        await person.has(notMarried);
        const attrs = await (await person.attributes()).collect();
        expect(attrs.length).toBe(2);
        attrs.forEach(att => { expect(att.isAttribute()).toBeTruthy(); });
        const filteredAttrs = await (await person.attributes(attrMarriedType)).collect();
        expect(filteredAttrs.length).toBe(1);
        const empty = await (await person.attributes(whateverType)).collect();
        expect(empty.length).toBe(0);
    });

    test('keys(...AttributeType)', async () => {
        const personType = await tx.putEntityType('person');
        const nameType = await tx.putAttributeType('name', env.dataType().STRING);
        const surnameType = await tx.putAttributeType('surname', env.dataType().STRING);

        await personType.key(nameType);
        await personType.has(surnameType);

        const personName = await nameType.create('James');
        const personSurname = await surnameType.create('Bond');

        const person = await personType.create();
        await person.has(personName);
        await person.has(personSurname);

        const keys = await (await person.keys()).collect();
        expect(keys.length).toBe(1);
        expect(keys[0].id).toBe(personName.id);

        const filteredKeys = await (await person.keys(nameType, surnameType)).collect();
        expect(filteredKeys.length).toBe(1);
        expect(filteredKeys[0].id).toBe(personName.id);

        const emptyKeys = await (await person.keys(surnameType)).collect();
        expect(emptyKeys.length).toBe(0);
    });
});