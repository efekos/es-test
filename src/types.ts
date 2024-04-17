import { AssertionError } from 'assert';

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

export { Test, TestEvents, EventMap, HandlerFn, getId, Suite, isTest, isAssertionError, TestResult, SummaryEntry };