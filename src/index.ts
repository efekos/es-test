#!/usr/bin/env node

import { describe, it, run } from './testRunner.js';
import { existsSync, readdirSync, statSync } from 'fs';
import chalk from 'chalk';
import { join } from 'path';
import logUpdate from 'log-update';
import { pluralize } from './functions.js';

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

logUpdate(`${chalk.yellow('RUNNING TEST(S)')} from ${testPaths.length} file${pluralize(testPaths.length)}`);
logUpdate.done();
run();

export { describe, it };