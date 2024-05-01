import { TestFormatMode, TestingObject, TestingObjectType, TestingObjectTypes } from './types.js';
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


interface Difference {expected:unknown;actual:unknown;existed:boolean};
type Differences = {[k:string]:Difference|Differences};

function isDifference(t:unknown): t is Difference {
    return typeof t === 'object' && 'expected' in t && 'actual' in t && 'existed' in t && typeof t.existed === 'boolean';
}
function findDifference(_expObject,_actObject):Differences{

    const res:Differences = {};

    function f(putter,expObject,actObject){

        Object.keys(actObject).forEach(key=>{

            const v1 = expObject[key];
            const v2 = actObject[key];

            if(typeof v2 === 'object'&&typeof v1 === 'object'){
                putter[key] = {};
                f(putter[key],v1,v2);
                return;
            }

            if(!(key in expObject)) {
                putter[key] = {expected:v1,actual:v2,existed:false};
                return;
            }

            putter[key] = {expected:v1,actual:v2,existed:true};
        });

    }

    f(res,_expObject,_actObject);
    return res;
}

function applyObject(str1:string,str2:string):string {
    const differences:Differences = findDifference(JSON.parse(str1),JSON.parse(str2));
    let s = '{';
    const c = ()=>!s.endsWith('{')?',':'';

    function f(parent:Differences){
            
        Object.keys(parent).forEach(key=>{

            const v = parent[key];
            
           

            if(isDifference(v)){
                if(v.existed) s += `${c()}${key}:`;
                else s += `${c()}${chalk.blue(key)+':'}`;
                const f = !v.existed?chalk.blue:(v.actual===v.expected?chalk.green:chalk.red);
                s+= (f===chalk.red?chalk.strikethrough(chalk.green(v.expected))+' ':'')+f(JSON.stringify(v.actual));
            } else {
                s += `${c()}${key}:`;
                s += '{';
                f(v);
                s += '}';
            }

        });
        
    }

    f(differences);
    s += '}';
    return s.replace(/([,:])/g,'$1 ');
}

function format(mode:TestFormatMode,str1:string,str2:string){
    switch(mode){
        case 'none': return chalk.red(str2);
        case 'str': return applyChanges(str1,str2);
        case 'obj': return applyObject(str1,str2);
    }
}

function trail(str: string) {
    if (str.length < 32) return str;
    else return `${str.slice(0, 16)}...`;
}


export {getId, isAssertionError, sortObject, applyChanges, trail, pluralize, isTestingObject,format};