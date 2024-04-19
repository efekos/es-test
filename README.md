# es-test `v1.0.1`

> Simple test runner to use in ESM modules.

After trying to use jest with an esm module for so long i just gave up and made this module. This module will scan for every .test.js or .spec.js file in current workspace and try
running them. You can limit scanning into one directory by passing in the dir name like this:
- `C:\myapp> estest` - Scans C:\myapp
- `C:\myapp> estest dist` - Scans C:\myapp\dist

# Usage

* `npm i -D @efekos/es-test`
* Create a test script to run estest: `"estest"` (Also create `pretest` to compile if you use TypeScript)
* Write some tests
* Run `npm test`

## Writing tests

```javascript
import {describe,it} from '@efekos/es-test/bin/testRunner.js' // You excplicitly have to import from testRunner.js i have no idea why
import {expect} from 'chai' // or any other assertion module

describe('9 + 10',()=>{ // create a suite with describe

    it('should be 21',()=>{ // create a test with it

        expect(9+10).to.be.equal(21);

    });

});
```
## Handling errors

```javascript
import {onError} from '@efekos/es-test/bin/testRunner.js'

onError('CustomError',(err)=>{ // Handle custom error types
    return {
        passed:false,
        expected:err.exp,
        actual:err.act,
        formatMode:'none' // 'str' will make every difference in actual value look red instead of making it completely red in summary
    }
})

```