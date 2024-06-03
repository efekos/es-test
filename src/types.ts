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

interface TestingObjectTypes {
    suite: Suite;
    test: Test;
    testCase: TestCase;
}
type TestingObjectType = keyof TestingObjectTypes;
type TestingObjectT = Suite | TestCase | Test;

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

type TestFormatMode = 'none' | 'str' | 'obj';

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

export { Test, TestEvents, EventMap, HandlerFn, Suite, TestResult, SummaryEntry, ErrorHandlerFn, TestingObjectT as TestingObject, TestingObjectType, TestingObjectTypes, TestCase, TestFormatMode };