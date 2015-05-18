Licensecheck [![Build Status](https://travis-ci.org/marcello3d/node-licensecheck.png)](https://travis-ci.org/marcello3d/node-licensecheck)
============

A quick way to see the licenses of modules you depend on, recursively.

There are a few other tools that do this too, but this one aims to be particularly robust to minimize manual work.
It checks multiple palaces for licenses (package.json, license files, and READMEs), and then flexibly matches
the license strings and normalizes the results so they are standardized licenses whenever possible, to ease
legal review.


Installation
------------

Run `npm -g install licensecheck`.

Usage
-----
```
licensecheck [OPTIONS] [PATH]
    -m, --missing-only       print only packages with missing license files.
    -h ARG, --highlight=ARG  highlight licenses which match this regular
                             expression.
    -f, --flat               display without tree nesting.
    --tsv                    short for --flat --separator="\t" --fields
                             nameversion,license,licensefile.
    --json                   emit JSON output.
    --fields=ARG             Comma separated list of fields to display.
                             Available fields include name, version,
                             nameversion, license, licensefile,
                             simplelicensefile as well as any top-level fields
                             in the package.json file, such as "homepage".
    -d ARG, --separator=ARG  separator between fields.
    --help                   Display this help.
```

Fields
------

The `--fields` flag can be used to control which fields are printed.  Valid
fields include:

- **`name`**: The name of the package, such as `markdown`
- **`version`**: The version of the package, such as `0.5.0`
- **`nameversion`**: The name and version, as an `@` separated tuple: `markdown@0.5.0`
- **`license`**: The name of the license, with URL: `MIT (http://www.opensource.org/licenses/mit-license.php)`
- **`licensefile`**: The path to the file used to determine the license: `node_modules/markdown/package.json`
- **`simplelicensefile`**: The path to the file used to determine the license, with `node_modules` reduced to `~` as an abbreviation: `node_modules/chalk ~ strip-ansi ~ ansi-regex/package.json`

Additionally, any toplevel field in the `package.json` file is available.  These include **`description`**, **`homepage`**, et cetera.

Examples
--------

```
$ licensecheck
└─ licensecheck (0.2.2) ── zlib License (https://spdx.org/licenses/Zlib) ── package.json
   ├─ colors (0.6.2) ── MIT License (https://spdx.org/licenses/MIT) ── node_modules/colors/MIT-LICENSE.txt
   ├─ markdown (0.5.0) ── MIT (http://www.opensource.org/licenses/mit-license.php) ── node_modules/markdown/package.json
   │  └─ nopt (2.1.2) ── MIT (https://github.com/isaacs/nopt/raw/master/LICENSE) ── node_modules/markdown ~ nopt/package.json
   │     └─ abbrev (1.0.5) ── MIT (https://github.com/isaacs/abbrev-js/raw/master/LICENSE) ── node_modules/markdown ~ nopt ~ abbrev/package.json
   ├─ spdx-license-list (1.1.0) ── MIT License (https://spdx.org/licenses/MIT) ── node_modules/spdx-license-list/package.json
   └─ treeify (1.0.1) ── MIT (http://lp.mit-license.org/) ── node_modules/treeify/package.json

$ licensecheck --flat
abbrev (1.0.5) ── MIT (https://github.com/isaacs/abbrev-js/raw/master/LICENSE) ── node_modules/markdown ~ nopt ~ abbrev/package.json
colors (0.6.2) ── MIT License (https://spdx.org/licenses/MIT) ── node_modules/colors/MIT-LICENSE.txt
licensecheck (0.2.2) ── zlib License (https://spdx.org/licenses/Zlib) ── package.json
markdown (0.5.0) ── MIT (http://www.opensource.org/licenses/mit-license.php) ── node_modules/markdown/package.json
nopt (2.1.2) ── MIT (https://github.com/isaacs/nopt/raw/master/LICENSE) ── node_modules/markdown ~ nopt/package.json
spdx-license-list (1.1.0) ── MIT License (https://spdx.org/licenses/MIT) ── node_modules/spdx-license-list/package.json
treeify (1.0.1) ── MIT (http://lp.mit-license.org/) ── node_modules/treeify/package.json

$ licensecheck --tsv --fields license | sort -u
MIT (http://lp.mit-license.org/)
MIT (http://www.opensource.org/licenses/mit-license.php)
MIT (https://github.com/isaacs/abbrev-js/raw/master/LICENSE)
MIT (https://github.com/isaacs/nopt/raw/master/LICENSE)
MIT License (https://spdx.org/licenses/MIT)
zlib License (https://spdx.org/licenses/Zlib)

$ licensecheck --json
[ { name: 'abbrev',
    version: '1.0.5',
    license: 'MIT (https://github.com/isaacs/abbrev-js/raw/master/LICENSE)',
    licensefile: 'node_modules/markdown/node_modules/nopt/node_modules/abbrev/package.json',
    homepage: 'https://github.com/isaacs/abbrev-js',
    description: 'Like ruby\'s abbrev module, but in js',
    dependencies: '' },
 ...
]
```

Overrides
---------

Occasionally, packages will not have a license that can be detected. If you manually verify the license and wish
to save this, you can add a `licenses.json` file in the top-level directory that contains details of the licenses.
The format (which may include comments) is:

````
/* This file holds overrides used by the licensecheck tool, handling dependencies
   with manually verified licenses that were not uploaded to npm. */
{
  "uglify-js": { "license": "BSD-2-Clause", "url": "https://github.com/mishoo/UglifyJS2" },
  "base64id": { "license": "MIT", "url": "https://github.com/faeldt/base64id" },
}
````

Use SPDX license names in this file.


How it works
------------

Licensecheck looks for license information in the following order:

1. `package.json` "license" field
2. `package.json` "licenses" field
3. file with `license` in its name
4. file with `readme` or `copying` in its name
    a. if the filename ends in `.md` or `.markdown`, parses markdown looking for a section with `license` in its name
    b. otherwise checks for `license` in its text

The results are then used to match against known licenses. License information is matched by both signature and by
name. Signatures are simply based on the text of a license (ignoring case, whitespace, and punctuation).
These are in the `license-files` folder. If the full license is just a name (e.g. just "MIT" appearing in any of the
above locations), then it is matched against the identifier used by the [SPDX license list](http://spdx.org/licenses/).
Package licenses that include explicit URLs are always preserved (i.e. not normalized).


Notes
-----

This is pretty hacky and experimental, so use at your own risk. 


License
-------

Licensecheck is open source software under the [zlib license][1].
[1]: LICENSE


DISCLAIMER
----------

I am not a lawyer. The output of this app should not be considered legal advice and is not guaranteed to be accurate.
