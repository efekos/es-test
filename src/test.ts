import { describe, it, run } from './index.js';
import { expect } from 'chai';

describe('top level suite', () => {
    describe('nested suite', () => {
        it('should work', () => {
            expect('foo').to.equal('foo');
        });
    });
});

describe('singular suite', () => {
    it('should work', () => {
        expect('bar').to.equal('bar');
    });
});

run();