import { describe, info, it } from './index.js';
import { expect } from 'chai';

describe('top level suite', () => {
    describe('nested suite', () => {
        it('should work', () => {
            expect('foo').to.equal('bar');
        });
    });
});

describe('singular suite', () => {
    it('should work', () => {
        expect('bar').to.equal('bar');
    });
});

info();