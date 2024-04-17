import { existsSync, readdirSync, stat, statSync } from 'fs';
import { join } from 'path';
import { run } from './testRunner.js';
import logUpdate from 'log-update';
import chalk from 'chalk';

const path = join(process.cwd(),process.argv.slice(2)[0]||'./');

if(!existsSync(path)) {
    console.log(`Path ${path} does not exist`);
    process.exit(1);
}

const pathStat = statSync(path);
if(!pathStat.isDirectory()){
    console.log(`Path ${path} is not a directory.`);
    process.exit(1);
}

const testPaths:string[] = [];
const ignore = ['node_modules'];

function findTest(path:string){
    const files = readdirSync(path);

    files.filter(r=>!ignore.includes(r)).map(e=>join(path,e)).forEach(filePath=>{
        const st = statSync(filePath);
        if(st.isDirectory()) findTest(filePath);
        else if (filePath.endsWith('.test.js')||filePath.endsWith('.spec.js')) testPaths.push(filePath);
    });
}

findTest(path);

for (const test of testPaths){
    logUpdate(`${chalk.bgYellow('IMPORTING FILE')} file://${test}`);
    await import(`file://${test}`);
}

logUpdate(`${chalk.bgYellow('RUNNING TESTS')}`);
logUpdate.done();
run();