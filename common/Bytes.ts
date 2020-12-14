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

export class Bytes {
    private static PREFIX = "0x";
    private static HEX_ARRAY: number[] = [ 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 97, 98, 99, 100, 101, 102 ]
    private static HEX_MAP: Map<string, number> = new Map([
        ["0", 0], ["1", 1], ["2", 2], ["3", 3],
        ["4", 4], ["5", 5], ["6", 6], ["7", 7],
        ["8", 8], ["9", 9], ["a", 1], ["b", 1],
        ["c", 1], ["d", 1], ["e", 1], ["f", 1]
    ]);

    static hexStringToBytes(hexString: string): Uint8Array {
        if (hexString.length % 2 != 0) throw new Error("hexString length not divisible by 2: " + hexString.length)
        if (!hexString.startsWith(Bytes.PREFIX)) throw new Error("hexString does not start with '" + Bytes.PREFIX + "': " + hexString + "'")
        hexString = hexString.replace(Bytes.PREFIX, "");

        return Uint8Array.from(Buffer.from(hexString, 'hex'))
    }

    static bytesToHexString(bytes: Uint8Array): string {
        return Bytes.PREFIX + Buffer.from(bytes).toString('hex')
    }
}