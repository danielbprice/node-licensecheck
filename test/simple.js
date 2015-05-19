var assert = require('assert')
var path = require('path')

var licensecheck = require('../index.js')

suite('Simple')

function testResult(result, name, license, filename) {
    assert.equal(name, result.name, "name mismatch for " + name)
    assert.equal(license, result.license, "license mismatch for " + name)
    if (filename) {
        assert.equal(filename, path.basename(result.licenseFile), "filename mismatch for " + name)
    }
}

test('licensecheck self', function () {
    var result = licensecheck('.', __dirname + "/../")

    testResult(result, "licensecheck", "zlib License (https://spdx.org/licenses/Zlib)", "package.json")

    assert.equal(6, result.deps.length)
    testResult(result.deps[0], "chalk", "MIT License (https://spdx.org/licenses/MIT)", "package.json")
    testResult(result.deps[1], "dashdash", "MIT License (https://spdx.org/licenses/MIT)", "LICENSE.txt")
    testResult(result.deps[2], "markdown", "MIT (http://www.opensource.org/licenses/mit-license.php)", "package.json")
    testResult(result.deps[3], "spdx-license-list", "MIT License (https://spdx.org/licenses/MIT)", "package.json")
    testResult(result.deps[4], "strip-json-comments", "MIT License (https://spdx.org/licenses/MIT)", "package.json")
    testResult(result.deps[5], "treeify", "MIT (http://lp.mit-license.org/)", "package.json")
})

test('licensecheck mochajs', function () {
    var result = licensecheck('.', __dirname + "/../node_modules/mocha")

    testResult(result, "mocha", "unknown")

    assert.equal(7, result.deps.length)

    testResult(result.deps[0], "commander", "MIT License (https://spdx.org/licenses/MIT)", "Readme.md")
    testResult(result.deps[1], "debug", "MIT License (https://spdx.org/licenses/MIT)", "package.json")
    testResult(result.deps[2], "diff", "BSD (http://github.com/kpdecker/jsdiff/blob/master/LICENSE)", "package.json")
    testResult(result.deps[3], "glob", 'BSD 2-clause "Simplified" License (https://spdx.org/licenses/BSD-2-Clause)', "package.json")
    testResult(result.deps[4], "growl", "MIT License (https://spdx.org/licenses/MIT)", "Readme.md")
    testResult(result.deps[5], "jade", "MIT License (https://spdx.org/licenses/MIT)", "LICENSE")
    testResult(result.deps[6], "mkdirp", "MIT License (https://spdx.org/licenses/MIT)", "package.json")

})
