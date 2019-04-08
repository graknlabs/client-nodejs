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

const DEFAULT_URI = "localhost:48555";
const INTEGRATION_TESTS_TIMEOUT = 50000;
const TEST_KEYSPACE = 'testkeyspace';

const childProcess = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const tmp = require('tmp');
const unzipper = require('unzipper');

const Tail = require('tail').Tail;


// Test Grakn with distribution code if TEST_ENV is dist
let GraknClient;
let graknClient;
if(process.env.TEST_ENV === 'dist'){
    GraknClient = require("../../dist/GraknClient");
    graknClient = new GraknClient(DEFAULT_URI);
}else {
    GraknClient = require("../../client-nodejs/src/GraknClient");
    graknClient = new GraknClient(DEFAULT_URI);
}

jest.setTimeout(INTEGRATION_TESTS_TIMEOUT);
//Every test file instantiate a new GraknEnvironment - so session will be new for every test file
let session;
let tempRootDir;
let graknRootDir;
let graknExecutablePath;

const unzipArchive = function(zipFile, extractPath) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(zipFile)
            .pipe(unzipper.Extract({ path: extractPath }))
            .once('close', () => {
                resolve();
            });
    });
};

const execGraknServerCommand = function (cmd) {
    return new Promise((resolve, reject) => {
        const graknServer = childProcess.spawn(graknExecutablePath, ['server', cmd], {
            cwd: graknRootDir,
        });
        graknServer.stdout.on('data', function(data) {
            console.log("GRAKN STDOUT ::: " + data);
        });
        graknServer.stderr.on('data', function(data) {
            console.log("GRAKN STDERR ::: " + data);
        });
        graknServer.once('exit', function (code) {
            if (code === 0) {
                resolve(code);
            } else {
                reject(code);
            }
        })
    });
}

const loadGqlFile = function(filePath, keyspace) {
    return new Promise((resolve, reject) => {
        const graknConsole = childProcess.spawn(graknExecutablePath, ['console', '-f', filePath, '-k', keyspace], {
            cwd: graknRootDir
        });

        graknConsole.once('exit', function (code) {
            if (code === 0) {
                resolve(code);
            } else {
                reject(code);
            }
        });
    });
};



module.exports = {
    session: async () => {
        session = await graknClient.session(TEST_KEYSPACE);
        return session;
    },
    sessionForKeyspace: (keyspace) => graknClient.session(keyspace),
    tearDown: async () => {
        if(session) await session.close();
        graknClient.close();

        await execGraknServerCommand('stop');

        fs.removeSync(tempRootDir);

    },
    dataType: () => GraknClient.dataType,
    graknClient,

    startGraknServer: async () => {
        console.log('[startGraknServer] start');
        const tmpobj = tmp.dirSync();
        tempRootDir = tmpobj.name;
        console.log('[startGraknServer] temp dir: ' + tempRootDir);
        tmpobj.removeCallback(); // disable automatic cleanup

        console.log('[startGraknServer] before unzipping');
        await unzipArchive('external/graknlabs_grakn_core/grakn-core-all-mac.zip', tempRootDir);
        console.log('[startGraknServer] after unzipping');

        graknRootDir = path.join(tempRootDir, 'grakn-core-all-mac');
        graknExecutablePath = path.join(graknRootDir, 'grakn');

        // fix permissions to not get EACCES
        fs.chmodSync(graknExecutablePath, 0o755);

        console.log('[startGraknServer] before grakn-start');
        await execGraknServerCommand('start');
        console.log('[startGraknServer] before grakn-stop');

        tail = new Tail(path.join(graknRootDir, 'logs', 'grakn.log'));

        tail.on("line", function(data) {
            console.log("GRAKN LOG ::: " +  data);
        });

        tail.on("error", function(error) {
            console.log('GRAKN LOG ERROR: ', error);
        });


    await loadGqlFile(path.resolve('.', 'tests/support/basic-genealogy.gql'), 'gene');
    },
    beforeAllTimeout: 100000 // empirically, this should be enough to unpack, bootup Grakn and load data
}
