import { EventMap, Suite, SummaryEntry, TestEvents, getId, isAssertionError } from './types.js';
import { EventEmitter } from 'events';
import chalk from 'chalk';
import logUpdate from 'log-update';

const stack: number[] = [];
const emitter = new EventEmitter<EventMap<TestEvents>>();
const handlerMap = new Map<number, Suite>();

emitter.on('addSuite', (title, handler) => {
    const id = getId();
    const parent: number | undefined = stack.length ? stack[stack.length - 1] : undefined;
    handlerMap.set(id, { id: id, title, tests: [], parent: parent, children: [], depth: stack.length });
    if (parent !== undefined) handlerMap.get(parent).children.push(id);
    stack.push(id);
    handler();
    stack.pop();
});

emitter.on('addTest', (title, handler) => {
    const id = getId();
    const parent = stack.length ? stack[stack.length - 1] : undefined;
    handlerMap.get(parent).tests.push({ handler, id, title, parent, depth: stack.length, result: { expected: '', actual: '', passed: true } });
});


export function describe(title: string, handler: () => void) {
    emitter.emit('addSuite', title, handler);
}

export function it(title: string, handler: () => void) {
    emitter.emit('addTest', title, handler);
}

const pass = `${chalk.green('✔')}`;
const fail = `${chalk.red('🗴')}`;
const testing = `${chalk.yellow('⚬')}`;
const d = '  ';

const sum: SummaryEntry[] = [];

export function run() {
    function runSuites(ids: number[]) {
        for (const id of ids) {
            const suite = handlerMap.get(id);

            console.log(`${d.repeat(suite.depth)}${suite.title}`);
            suite.tests.forEach(test => {

                const depth = d.repeat(test.depth);

                try {
                    logUpdate(`${depth}${testing} ${test.title}`);
                    test.handler();
                    logUpdate(`${depth}${pass} ${test.title}`);
                } catch (e) {
                    if (isAssertionError(e)) {
                        test.result = { passed: false, expected: JSON.stringify(e.expected), actual: JSON.stringify(e.actual) };
                        logUpdate(`${depth}${fail} ${test.title}`);
                    }
                } finally {
                    logUpdate.done();
                    if (!test.result.passed) {
                        console.log(`${depth}${fail}  Expected: ${test.result.expected}`);
                        console.log(`${depth}${fail}  Actual:   ${test.result.actual}`);
                    }

                    sum.push({...test.result,totalTitle:`${handlerMap.get(test.parent).title} > ${test.title}`});
                }

            });
            runSuites(suite.children);

            handlerMap.delete(id);
            if (handlerMap.size === 0) printSum();
        }
    }

    const suiteIds = Array.from(handlerMap).map(r => r[1]).filter(r => r.parent === undefined).map(r => r.id);
    runSuites(suiteIds);
}


function printSum() {

    const passed = sum.filter(e=>e.passed).length;
    const failed = sum.filter(e=>!e.passed).length;
    const total = passed + failed;

    sum.forEach(entry => {
        if(!entry.passed) {
            console.log(' ');
            console.log(`${chalk.whiteBright(chalk.bgRed('FAIL'))} ${chalk.red(entry.totalTitle)}`);
            console.log(` Expected: ${entry.expected}`);
            console.log(` Actual:   ${entry.actual}`);
        }
    });

    const fText = chalk.red(`${failed} tests failed`);
    const pText = chalk.green(`${passed} tests passed`);
    const tText = `${total} tests total`;
    const a = [];
    if(failed>0) a.push(fText);
    if(passed>0) a.push(pText);
    a.push(tText);
    console.log(' ');
    console.log(chalk.bold(a.join(', ')));

}