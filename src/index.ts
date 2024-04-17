import { EventMap,Suite,Test,TestEvents,getId } from './types';
import { EventEmitter } from 'events';

const stack = [];
const emitter = new EventEmitter<EventMap<TestEvents>>();
const handlerMap = new Map<number, Suite | Test>();

emitter.on('addSuite', (title, handler) => {
    const id = getId();
    handlerMap.set(id, { id: id, title: title, tests: [] });
    handler();
});

emitter.on('addTest', (title, handler) => {
    const id = getId();
    handlerMap.set(id, { id, title, handler });
});


export function describe(title: string, handler: () => void) {
    emitter.emit('addSuite', title, handler);
}

export function it(title: string, handler: () => void) {
    emitter.emit('addTest', title, handler);
}

export function info() {
    console.log(handlerMap);
}