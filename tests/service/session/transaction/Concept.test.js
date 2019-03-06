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
    tx = await session.transaction(env.txType().WRITE);
})

afterEach(() => {
    tx.close();
});

describe("Concept methods", () => {

    test("delete type", async () => {
        const personType = await tx.putEntityType('person');
        const schemaConcept = await tx.getSchemaConcept('person');
        expect(schemaConcept.isSchemaConcept()).toBeTruthy();
        await personType.delete();
        const nullSchemaConcept = await tx.getSchemaConcept('person');
        expect(nullSchemaConcept).toBeNull();
    });

    test("delete instance", async () => {
        const personType = await tx.putEntityType('person');
        const person = await personType.create();
        await person.delete();
        const nullConcept = await tx.getConcept(person.id);
        expect(nullConcept).toBeNull();
    });

    test("delete concept already deleted", async () => {
        const personType = await tx.putEntityType('person');
        const person = await personType.create();
        await person.delete();
        const nullConcept = await tx.getConcept(person.id);
        expect(nullConcept).toBeNull();
        await expect(person.delete()).rejects.toThrowError();
    });

    test("instance isEntity/isRelation/isAttribute", async () => {
        const personType = await tx.putEntityType('person');
        const person = await personType.create();
        expect(person.isEntity()).toBeTruthy();
        expect(person.isRelation()).toBeFalsy();
        expect(person.isAttribute()).toBeFalsy();

        const relationType = await tx.putRelationType('marriage');
        const marriage = await relationType.create();
        expect(marriage.isEntity()).toBeFalsy();
        expect(marriage.isRelation()).toBeTruthy();
        expect(marriage.isAttribute()).toBeFalsy();

        const attributeType = await tx.putAttributeType('employed', env.dataType().BOOLEAN);
        const employed = await attributeType.create(true);
        expect(employed.isEntity()).toBeFalsy();
        expect(employed.isRelation()).toBeFalsy();
        expect(employed.isAttribute()).toBeTruthy();
    });
});