import { TestingObject, TestingObjectType, TestingObjectTypes } from './types.js';
import { AssertionError } from 'assert';
import chalk from 'chalk';

let id = -1;
function getId(): number {
    return ++id;
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


export {getId, isAssertionError, sortObject, applyChanges, trail, pluralize, isTestingObject};