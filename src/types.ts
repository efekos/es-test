/*
MIT License

Copyright (c) 2024 efekos

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { AssertionError } from 'assert';
import chalk from 'chalk';

interface TestEvents {
    addSuite: never;
    addTest: never;
}
type EventMap<T> = Record<keyof T, any[]>;
type HandlerFn = () => void;

let id = -1;
function getId(): number {
    return ++id;
}

interface Suite {
    id: number;
    title: string;
    tests: Test[];
    parent?: number;
    children: number[];
    depth: number;
}

interface Test {
    id: number;
    title: string;
    parent?: number;
    handler: HandlerFn;
    depth: number;
    result: TestResult;
}

interface TestResult {
    passed: boolean;
    expected: string;
    actual: string;
    formatMode: TestFormatMode;

}

type TestFormatMode = 'none' | 'str';

interface SummaryEntry {
    passed: boolean;
    formatMode: TestFormatMode;
    expected: string;
    actual: string;
    totalTitle: string;
}


function isTest(thing: Test | Suite): thing is Test {
    return 'handler' in thing;
}

function isAssertionError(e: Error): e is AssertionError {
    return e.name === 'AssertionError';
}

function sortObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sortObject);
    }

    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};

    sortedKeys.forEach(key => {
        sortedObj[key] = sortObject(obj[key]);
    });

    return sortedObj;
}

function applyChanges(str1:string, str2:string):string {
    let result = '';

    for (let i = 0; i < Math.min(str1.length, str2.length)-1; i++) {
        if(str1[i] === str2[i]) result += str2[i];
        else result += chalk.red(str2[i]);
    }

    if(str2.length>str1.length) result += chalk.red(str2.slice(str1.length));
    else if(str1.length>str2.length) result += chalk.red(str1.slice(str2.length));
    else result += chalk.red(str2[str2.length-1]);
    
    return result;
}

export { Test, TestEvents, EventMap, HandlerFn, getId, Suite, isTest, isAssertionError, TestResult, SummaryEntry, sortObject, applyChanges };