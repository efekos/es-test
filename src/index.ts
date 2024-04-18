#!/usr/bin/env node

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


import { describe, it, run } from './testRunner.js';
import { existsSync, readdirSync, statSync } from 'fs';
import chalk from 'chalk';
import { join } from 'path';
import logUpdate from 'log-update';

process.env.TESTING = '1';

const path = join(process.cwd(), process.argv.slice(2)[0] || './');

if (!existsSync(path)) {
    console.log(`Path ${path} does not exist`);
    process.exit(1);
}

const pathStat = statSync(path);
if (!pathStat.isDirectory()) {
    console.log(`Path ${path} is not a directory.`);
    process.exit(1);
}

const testPaths: string[] = [];
const ignore = ['node_modules'];

function findTest(path: string) {
    const files = readdirSync(path);

    files.filter(r => !ignore.includes(r)).map(e => join(path, e)).forEach(filePath => {
        const st = statSync(filePath);
        if (st.isDirectory()) findTest(filePath);
        else if (filePath.endsWith('.test.js') || filePath.endsWith('.spec.js')) testPaths.push(filePath);
    });
}

findTest(path);

for (const test of testPaths) {
    logUpdate(`${chalk.yellow('IMPORTING FILE')} file://${test}`);
    await import(`file://${test}`);
}

logUpdate(`${chalk.yellow('RUNNING TESTS')}`);
logUpdate.done();
run();

export { describe, it };