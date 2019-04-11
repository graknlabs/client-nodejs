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
    await env.startGraknServer();
    session = await env.session();
}, env.beforeAllTimeout);

afterAll(async () => {
    await env.tearDown();
});

beforeEach(async () => {
    tx = await session.transaction().write();
})

afterEach(() => {
    tx.close();
});

describe("Concept methods", () => {

    test("getConcept", async () => {
        env.log('[test]: start of getConcept');
        await tx.query("define person sub entity;");
        const iterator = await tx.query("insert $x isa person;");
        const person = (await iterator.next()).map().get('x');
        const personId = person.id;

        const samePerson = await tx.getConcept(personId);
        expect(samePerson.isThing()).toBeTruthy();
        expect(samePerson.id).toBe(personId);

        // retrieve non existing id should return null
        const nonPerson = await tx.getConcept("not-existing-id");
        expect(nonPerson).toBe(null);
    });

    // Bug regression test
    test.skip("Ensure no duplicates in metatypes", async () => {
        env.log('[test]: start of Ensure no duplicates in metatypes');
        await tx.query("define person sub entity;");
    const result = await tx.query("match $x sub entity; get;");
    const concepts = (await result.collectConcepts());
    expect(concepts.length).toBe(2);
    const set = new Set(concepts.map(concept => concept.id));
    expect(set.size).toBe(2);
    });

    test.skip("execute query with no results", async () => {
        env.log('[test]: start of execute query with no results');
        await tx.query("define person sub entity;");
    const result = await tx.query("match $x isa person; get;")
    const emptyArray = await result.collect();
    expect(emptyArray).toHaveLength(0);
    });

    test.skip("execute compute count on empty graph - Answer of Value", async () => {
        env.log('[test]: start of execute compute count on empty graph - Answer of Value');
        const result = await tx.query("compute count;");
    const answer = await(result.next());
    expect(answer.number()).toBe(0);
    });

    test.skip("execute aggregate count on empty graph - Answer of Value", async () => {
        env.log('[test]: start of execute aggregate count on empty graph - Answer of Value');
        const result = await tx.query("match $x sub thing; get; count;");
    const answer = await(result.next());
    expect(answer.number()).toBe(4);
    });

    test.skip("delete type", async () => {
        env.log('[test]: start of delete type');
        const personType = await tx.putEntityType('person');
        const schemaConcept = await tx.getSchemaConcept('person');
        expect(schemaConcept.isSchemaConcept()).toBeTruthy();
        await personType.delete();
        const nullSchemaConcept = await tx.getSchemaConcept('person');
        expect(nullSchemaConcept).toBeNull();
    });

    test.skip("delete instance", async () => {
        env.log('[test]: start of delete instance');
        const personType = await tx.putEntityType('person');
        const person = await personType.create();
        await person.delete();
        const nullConcept = await tx.getConcept(person.id);
        expect(nullConcept).toBeNull();
    });

    test.skip("delete concept already deleted", async () => {
        env.log('[test]: start of delete concept already deleted');
        const personType = await tx.putEntityType('person');
        const person = await personType.create();
        await person.delete();
        const nullConcept = await tx.getConcept(person.id);
        expect(nullConcept).toBeNull();
        await expect(person.delete()).rejects.toThrowError();
    });

    test.skip("instance isEntity/isRelation/isAttribute", async () => {
        env.log('[test]: start of instance isEntity/isRelation/isAttribute');
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

    test.skip("group query - Answer of answerGroup", async ()=>{
        env.log('[test]: start of group query - Answer of answerGroup');
        const localSession = await env.sessionForKeyspace('groupks');
        let localTx = await localSession.transaction().write();
        const parentshipMap = await buildParentship(localTx);
        localTx = await localSession.transaction().write();
        const result = await localTx.query("match $x isa person; $y isa person; (parent: $x, child: $y) isa parentship; get; group $x;");
        const answer = await(result.next());
        expect(answer.owner().id).toBe(parentshipMap.parent);
        expect(answer.answers()[0].map().size).toBe(2);
        expect(answer.answers()[0].map().get('x').id).toBe(parentshipMap.parent);
        expect(answer.answers()[0].map().get('y').id).toBe(parentshipMap.child);

        await localTx.close();
        await localSession.close();
        await env.graknClient.keyspaces().delete('groupks');
    });


    test.skip("getSchemaConcept", async () => {
        env.log('[test]: start of getSchemaConcept');
        await tx.query("define person sub entity;");

        const personType = await tx.getSchemaConcept("person");
        expect(personType.isSchemaConcept()).toBeTruthy();

        const nonPerson = await tx.getSchemaConcept("not-existing-label");
        expect(nonPerson).toBe(null);

    });

    test.skip("putEntityType", async () => {
        env.log('[test]: start of putEntityType');
        const personType = await tx.putEntityType("person");
        expect(personType.isSchemaConcept()).toBeTruthy();
        expect(personType.isEntityType()).toBeTruthy();
    });

    test.skip("putRelationType", async () => {
        env.log('[test]: start of putRelationType');
        const marriage = await tx.putRelationType("marriage");
        expect(marriage.isSchemaConcept()).toBeTruthy();
        expect(marriage.isRelationType()).toBeTruthy();
    });

    test.skip("putAttributeType", async () => {
        env.log('[test]: start of putAttributeType');
        const attributeType = await tx.putAttributeType("firstname", env.dataType().STRING);
        expect(attributeType.isAttributeType()).toBeTruthy();
    });

    test.skip("putRole", async () => {
        env.log('[test]: start of putRole');
        const role = await tx.putRole("father");
        expect(role.isRole()).toBeTruthy();
        expect(role.baseType).toBe("ROLE");
    });

    test.skip("putRule", async () => {
        env.log('[test]: start of putRule');
        const label = "genderisedParentship";
        const when = "{ (parent: $p, child: $c) isa parentship; $p has gender 'female'; $c has gender 'male'; };";
        const then = "{ (mother: $p, son: $c) isa parentship; };";
        const rule = await tx.putRule(label, when, then);
        expect(await rule.label()).toBe(label);
        expect(rule.isRule()).toBeTruthy();
    });

    test.skip("getAttributesByValue", async () => {
        env.log('[test]: start of getAttributesByValue');
        const firstNameAttributeType = await tx.putAttributeType("firstname", env.dataType().STRING);
        env.log("after firstNameAttributeType");
        const middleNameAttributeType = await tx.putAttributeType("middlename", env.dataType().STRING);
        env.log("after middleNameAttributeType");
        const a1 = await firstNameAttributeType.create('James');
        env.log("after a1");
        const a2 = await middleNameAttributeType.create('James');
        env.log("after a2");
        const attributes = await (await tx.getAttributesByValue('James', env.dataType().STRING)).collect();
        env.log("after attributes");
        expect(attributes.length).toBe(2);
        env.log("after expect(attributes.length).toBe(2)");
        expect(attributes.filter(a => a.id === a1.id).length).toBe(1);
        env.log("after expect(attributes.filter(a => a.id === a1.id).length).toBe(1);");
        expect(attributes.filter(a => a.id === a2.id).length).toBe(1);
        env.log("after expect(attributes.filter(a => a.id === a2.id).length).toBe(1);");
        attributes.forEach(async attr => {
            env.log("in attributes.forEach");
            expect(attr.isAttribute()).toBeTruthy();
            env.log("after expect(attr.isAttribute()).toBeTruthy();");
            expect(await attr.value()).toBe('James');
            env.log("after expect(await attr.value()).toBe('James');");
        });
        env.log("after attributes.forEach");
        const bondAttributes = await (await tx.getAttributesByValue('Bond', env.dataType().STRING)).collect();
        env.log("after bondAttributes");
        expect(bondAttributes).toHaveLength(0);
        env.log("after expect(bondAttributes).toHaveLength(0);");
        });
});