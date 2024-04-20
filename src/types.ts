import { AssertionError } from 'assert';
import chalk from 'chalk';

interface TestEvents {
    addSuite: never;
    addTest: never;
    addTestCase: never;
    addErrorHandler: never;
}
type EventMap<T> = Record<keyof T, any[]>;
type HandlerFn = () => void;
type ErrorHandlerFn = (e: Error) => TestResult;


let id = -1;
function getId(): number {
    return ++id;
}

interface TestingObjectTypes {
    suite: Suite;
    test: Test;
    testCase: TestCase;
}
type TestingObjectType = keyof TestingObjectTypes;
type TestingObjectT = Suite|TestCase|Test;

interface TestingObject {
    id: number;
    type: TestingObjectType;
    parent?: number;
    depth: number;
}

interface Suite extends TestingObject {
    title: string;
    tests: number[];
    children: number[];
}

interface TestCase extends TestingObject {
    handler: HandlerFn;
    caseNo: number;
    result: TestCaseResult;
}

interface Test extends TestingObject {
    title: string;
    handler: HandlerFn;
    result: TestResult;
    children: number[];
}

interface TestCaseResult {
    passed: boolean;
    expected: string;
    actual: string;
    formatMode: TestFormatMode;
}

interface TestResult {
    passed: boolean;
    expected: string;
    actual: string;
    formatMode: TestFormatMode;
    passedCases?: number;
    totalCases?: number;
}

type TestFormatMode = 'none' | 'str';

interface SummaryEntry {
    passed: boolean;
    formatMode: TestFormatMode;
    expected: string;
    actual: string;
    totalTitle: string;
    passedCases?: number;
    totalCases?: number;
    failedCases?: number[];
}


function isTestingObject<T extends TestingObjectType>(thing: TestingObject, type: T): thing is TestingObjectTypes[T] {
    return thing.type === type;
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

function pluralize(n: number): string {
    return n > 1 ? 's' : '';
}

function applyChanges(str1: string, str2: string): string {
    let result = '';

    for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
        if (str1[i] === str2[i]) result += str2[i];
        else result += chalk.red(str2[i]);
    }

    if (str2.length > str1.length) result += chalk.red(str2.slice(str1.length));
    else if (str1.length > str2.length) result += chalk.gray(str1.slice(str2.length));

    return result;
}

function trail(str: string) {
    if (str.length < 32) return str;
    else return `${str.slice(0, 16)}...`;
}

export { Test, TestEvents, EventMap, HandlerFn, getId, Suite, isAssertionError, TestResult, SummaryEntry, sortObject, applyChanges, ErrorHandlerFn, trail, pluralize, isTestingObject, TestingObjectT as TestingObject, TestingObjectType, TestingObjectTypes,TestCase };