
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
}

interface Test {
    id: number;
    title: string;
    handler: HandlerFn;
}



function isTest(thing:Test | Suite): thing is Test {
    return 'handler' in thing;
}

export {Test,TestEvents,EventMap,HandlerFn,getId,Suite,isTest};