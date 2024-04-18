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
}

interface SummaryEntry {
    passed: boolean;
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

    if(str2.length>str1.length)
    result += chalk.red(str2.slice(str1.length));
    
    return result;
}

export { Test, TestEvents, EventMap, HandlerFn, getId, Suite, isTest, isAssertionError, TestResult, SummaryEntry, sortObject, applyChanges };