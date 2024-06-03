import { ErrorHandlerFn, EventMap, HandlerFn, Suite, SummaryEntry, Test, TestCase, TestEvents, TestingObject } from './types.js';
import { applyChanges, format, getId, isAssertionError, isTestingObject, pluralize, sortObject, trail } from './functions.js';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import logUpdate from 'log-update';


const suiteStack: number[] = [];
const testStack: number[] = [];
const emitter = new EventEmitter<EventMap<TestEvents>>();
const objectMap = new Map<number, TestingObject>();
const errorHandlerMap = new Map<string, ErrorHandlerFn>();
const warns = [];

function findParentFrom<T>(stack: T[]): T | undefined {
    return stack.length ? stack[stack.length - 1] : undefined;
}

emitter.on('addSuite', (title, handler) => {
    const id = getId();
    const parent: number | undefined = findParentFrom(suiteStack);
    objectMap.set(id, { type: 'suite', id: id, title, tests: [], parent: parent, children: [], depth: suiteStack.length });
    if (parent !== undefined) (objectMap.get(parent) as Suite).children.push(id);
    suiteStack.push(id);
    handler();
    suiteStack.pop();
});

emitter.on('addTest', (title, handler, cases) => {
    const id = getId();
    const parent = findParentFrom(suiteStack);
    if (parent === undefined /*but tests should have a parent*/) warns.push(`tests must have a suite parent, '${title}' does not. That's why it did not run.`);
    objectMap.set(id, { type: 'test', children: [], handler, id, title, parent, depth: suiteStack.length, result: { expected: '', actual: '', passed: true, formatMode: 'str' } });
    if (parent !== undefined) (objectMap.get(parent) as Suite).tests.push(id);
    if (cases) {
        try {
            testStack.push(id);
            handler();
            testStack.pop();
        } catch (error) {
            logUpdate.done();
            console.log(`${chalk.red('err')} ${error.name}: ${error.message}`);
            if (isAssertionError(error) || errorHandlerMap.has(error.name))
                console.log(`${chalk.red('err')} Tests with cases should not contain any testing code outside cases, looks like '${title}' does.`);

            console.log(`${chalk.red('err')} process exit with code 1`);
            process.exit(1);
        }
    }
});

emitter.on('addErrorHandler', (name, handler) => {
    errorHandlerMap.set(name, handler);
});

emitter.on('addTestCase', handler => {
    const id = getId();
    const parent = findParentFrom(testStack);
    const currentSuite = findParentFrom(suiteStack);
    const t = currentSuite ? `from suite '${(objectMap.get(currentSuite) as Suite).title}' ` : '';
    if (parent === undefined) {
        logUpdate.done();
        console.log(`${chalk.red('err')} test cases must have a parent that is a test, but at least one of the test cases ${t}does not.`);

        console.log(`${chalk.red('err')} process exit with code 2`);
        process.exit(2);
    }
    const parentTest = objectMap.get(parent) as Test;
    parentTest.children.push(id);
    objectMap.set(id, { type: 'testCase', caseNo: parentTest.children.length, handler, id, depth: parentTest.depth + 1, result: { actual: '', expected: '', formatMode: 'none', passed: true } });
});

export function onError(name: string, handler: ErrorHandlerFn) {
    emitter.emit('addErrorHandler', name, handler);
}

export function describe(title: string, handler: HandlerFn) {
    emitter.emit('addSuite', title, handler);
}

export function it(title: string, handler: HandlerFn, cases: boolean = false) {
    emitter.emit('addTest', title, handler, cases);
}

export function inst(handler: HandlerFn) {
    emitter.emit('addTestCase', handler);
}

const toBeA = /^expected [\u0000-\uffff]+ to be an? ([a-z]+)$/;
const pass = `${chalk.green('✔')} `;
const fail = `${chalk.red('🗴')}`;
const testing = `${chalk.yellow('⚬')}`;
const d = '  ';

const sum: SummaryEntry[] = [];

export function run() {
    function runSuites(ids: number[]) {
        for (const id of ids) {
            const suite = objectMap.get(id) as Suite;

            console.log(`${d.repeat(suite.depth)}${suite.title}`);
            suite.tests.forEach(t => {

                const test = objectMap.get(t) as Test;
                const depth = d.repeat(test.depth);

                function rawTest() {

                    try {
                        logUpdate(`${depth}${testing} ${test.title}`);
                        test.handler();
                        logUpdate(`${depth}${pass}${test.title}`);
                    } catch (e) {
                        if (isAssertionError(e)) {
                            test.result = {
                                passed: false,
                                expected: JSON.stringify(sortObject(e.expected)),
                                actual: JSON.stringify(sortObject(e.actual)),
                                formatMode: typeof e.actual === 'object' ? 'obj' : 'str'
                            };

                            if (toBeA.test(e.message)) {
                                const g = e.message.match(toBeA)[1];
                                test.result.expected = g;
                                test.result.actual = typeof e.actual;
                                test.result.formatMode = 'none';
                            }
                        } else if (errorHandlerMap.has(e.name)) {
                            const handle = errorHandlerMap.get(e.name);
                            test.result = handle(e);
                        } else {
                            test.result = {
                                passed: false,
                                expected: 'No errors',
                                actual: `${e.name}: ${e.message}`,
                                formatMode: 'none'
                            };
                        }
                        logUpdate(`${depth}${fail}${test.title}`);
                    } finally {
                        logUpdate.done();
                        if (!test.result.passed) {
                            console.log(`${depth}${fail}  Expected: ${chalk.green(trail(test.result.expected))}`);
                            console.log(`${depth}${fail}  Actual:   ${chalk.red(trail(test.result.actual))}`);
                        }

                        sum.push({ ...test.result, totalTitle: `${(objectMap.get(test.parent) as Suite).title} > ${test.title}` });
                    }
                }

                function casedTest() {
                    const totalCases = test.children.length;
                    test.result.passedCases = totalCases;
                    test.result.totalCases = totalCases;
                    let curCaseNo = 0;
                    const failedCases: number[] = [];
                    logUpdate(`${depth}${testing} ${test.title} ${chalk.gray(`${curCaseNo}/${totalCases}`)}`);

                    test.children.forEach(i => {
                        logUpdate(`${depth}${testing} ${test.title} ${chalk.gray(`${curCaseNo}/${totalCases}`)}`);
                        const testCase = objectMap.get(i) as TestCase;

                        try {
                            testCase.handler();
                        } catch (e) {
                            failedCases.push(testCase.id);
                            test.result.passedCases--;
                            test.result.passed = false;
                            if (isAssertionError(e))
                                testCase.result = {
                                    passed: false,
                                    expected: JSON.stringify(sortObject(e.expected)),
                                    actual: JSON.stringify(sortObject(e.actual)),
                                    formatMode: typeof e.actual === 'object' ? 'obj' : 'str'
                                };
                            else if (errorHandlerMap.has(e.name)) testCase.result = errorHandlerMap.get(e.name)(e);
                            else testCase.result = { passed: false, formatMode: 'none', expected: 'No errors', actual: `${e.name}: ${e.message}` };

                            if (toBeA.test(e.message)) {
                                const g = e.message.match(toBeA)[1];
                                testCase.result.expected = g;
                                testCase.result.actual = typeof e.actual;
                                testCase.result.formatMode = 'none';
                            }

                        }

                        curCaseNo++;
                    });
                    logUpdate(`${depth}${test.result.passed ? pass : fail}${test.title} ${chalk.gray(`${curCaseNo}/${totalCases}`)}`);
                    logUpdate.done();
                    if (!test.result.passed) {
                        console.log(`${depth}${fail}  ${failedCases.length} case${pluralize(failedCases.length)} failed`);
                        failedCases.forEach(e => {
                            const testCase = objectMap.get(e) as TestCase;

                            console.log(`${depth}${fail}   Case #${testCase.caseNo} failed`);
                            console.log(`${depth}${fail}     Expected: ${chalk.green(trail(testCase.result.expected))}`);
                            console.log(`${depth}${fail}     Actual:   ${chalk.red(trail(testCase.result.actual))}`);
                        });
                    }

                    sum.push({ ...test.result, totalTitle: `${(objectMap.get(test.parent) as Suite).title} > ${test.title}`, failedCases });
                }

                if (test.children.length > 0) casedTest();
                else rawTest();
            });
            runSuites(suite.children);

            objectMap.delete(id);
            if (Array.from(objectMap.values()).filter(r => isTestingObject(r, 'suite')).length === 0) printSum();
        }
    }

    const suiteIds = Array.from(objectMap).map(r => r[1]).filter(r => r.parent === undefined && isTestingObject(r, 'suite')).map(r => r.id);
    runSuites(suiteIds);
}


function printSum() {

    const passed = sum.filter(e => e.passed).length;
    const failed = sum.filter(e => !e.passed).length;
    const total = passed + failed;

    sum.forEach(entry => {
        if (!('passedCases' in entry))
            if (!entry.passed) {
                console.log(' ');
                console.log(`${chalk.redBright(chalk.bold('FAIL'))} ${chalk.red(entry.totalTitle)}`);
                console.log(` Expected: ${chalk.green(entry.expected)}`);
                console.log(` Actual:   ${format(entry.formatMode, entry.expected, entry.actual)}`);
            }

        if ('passedCases' in entry)
            if (entry.passedCases !== entry.totalCases) {
                console.log(' ');
                console.log(`${chalk.redBright(chalk.bold('FAIL'))} ${chalk.red(entry.totalTitle)}`);
                console.log(` ${entry.passedCases} case${pluralize(entry.passedCases)} passed, ${entry.failedCases.length} case${pluralize(entry.failedCases.length)} failed.`);
                entry.failedCases.forEach(i => {
                    const { caseNo, result } = objectMap.get(i) as TestCase;

                    console.log(` Case #${caseNo}`);
                    console.log(`  Expected: ${chalk.green(result.expected)}`);
                    console.log(`  Actual:   ${format(result.formatMode, result.expected, result.actual)}`);
                });
            }
    });

    const fText = chalk.red(`${failed} test${pluralize(failed)} failed`);
    const pText = chalk.green(`${passed} test${pluralize(passed)} passed`);
    const tText = `${total} test${pluralize(total)} total`;
    const a = [];
    if (failed > 0) a.push(fText);
    if (passed > 0) a.push(pText);
    a.push(tText);
    console.log(' ');
    console.log(chalk.bold(a.join(', ')));
    warns.map(r => `${chalk.yellow('warn')} ${r}`).forEach(r => console.log(r));

}