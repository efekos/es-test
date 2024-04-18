# es-test `v1.0.0`

> Simple test runner to use in ESM modules.

After trying to use jest with an esm module for so long i just gave up and made this module.

# Usage

* `npm i -D es-test`
* Create a test script to run estest: `"estest"` (Also create `pretest` to compile if you use TypeScript)
* Write some tests
* Run `npm test`

## Writing tests

```javascript
import {describe,it} from 'es-test/bin/testRunner.js' // You excplicitly have to import from testRunner.js i have no idea why
import {expect} from 'chai' // or any other assertion module

describe('9 + 10',()=>{ // create a suite with describe

    it('should be 21',()=>{ // create a test with it

        expect(9+10).to.be.equal(21);

    });

});
```

That's it, only two functions were describe and it so idk what else can i say here