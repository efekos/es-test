export function describe(title: string, handler: () => void) {
    console.log(title);
    handler();
}

export function it(title: string, handler: () => void) {
    console.log(title);
    handler();
}