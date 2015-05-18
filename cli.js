// Based on code shamelessly lifted from https://github.com/shtylman/node-weaklink (with permission)

"use strict"

var chalk = require("chalk")
var dashdash = require("dashdash")
var treeify = require("treeify")
var fs = require("fs")
var stripJsonComments = require("strip-json-comments")

var licensecheck = require("./index.js")

var path = "."
var overridesPath = "./licenses.json"
var highlight = null
var tsvFields = ["nameversion", "license", "licensefile"]
var jsonFields = ["name", "version", "license", "licensefile", "homepage", "description", "dependencies"]
var prettyFields = ["nameversion", "license", "simplelicensefile"]
var allFields = ["name", "version", "nameversion", "license", "licensefile", "simplelicensefile"]
var fields = null
var sep = null
var jsonOutputArray = []

var options = [
    {
        names: ["missing-only", "m"],
        type: "bool",
        help: "print only packages with missing license files",
        default: false
    },
    {
        names: ["highlight", "h"],
        type: "string",
        help: "highlight licenses which match this regular expression",
        default: null
    },
    {
        names: ["flat", "f"],
        type: "bool",
        help: "display without tree nesting",
        default: false
    },
    {
        names: ["tsv"],
        type: "bool",
        help: ("short for --flat --separator=\"\\t\" --fields " + tsvFields.join(",")),
        default: false
    },
    {
        names: ["json"],
        type: "bool",
        help: "emit JSON output",
        default: false
    },
    {
        names: ["fields"],
        type: "string",
        help: ("Comma separated list of fields to display.  Available " +
              "fields include " + allFields.join(", ") + " as well as " +
              "any top-level fields in the package.json file, such as " +
              "\"homepage\"."),
        default: null
    },
    {
        names: ["separator", "d"],
        type: "string",
        help: "separator between fields",
        default: " ── "
    },
    {
        names: ["help"],
        type: "bool",
        help: "Display this help."
    }
]

var parser = dashdash.createParser({options: options})

function usage() {
    var help = parser.help()
    console.error("usage: licensecheck [OPTIONS] [PATH]")
    console.error(help)
    process.exit(2)
}

try {
    var opts = parser.parse(process.argv)
} catch (e) {
    console.error("error: " + e.message)
    usage()
}

if (opts._args.length > 0) {
    path = opts._args[0]
}
if (opts._args.length > 1) {
    usage()
}

if (opts.help) {
    usage()
}

if (opts.tsv) {
    chalk.enabled = false
    opts.flat = true
    opts.separator = "\t"
    fields = tsvFields
}

if (opts.json) {
    chalk.enabled = false
    opts.flat = true
    fields = jsonFields
}

if (opts.fields) {
    fields = opts.fields.split(",")
}

if (fields === null) {
    fields = prettyFields
}

if (opts.separator) {
    sep = opts.separator
}
sep = sep.replace(/\\t/g, "\t").replace(/\\n/g, "\n").replace(/\\0/g, "\0")

if (opts.highlight) {
    highlight = RegExp(opts.highlight, "i")
}

var overrides = fs.existsSync(overridesPath) &&
    JSON.parse(stripJsonComments(fs.readFileSync(overridesPath, "utf8"))) || {}


function main() {
    var dependencies
    if (opts.json) {
        dependencies = makeFlatDependencyMap(licensecheck(".", path, overrides))
        Object.keys(dependencies).sort().forEach(function (key) {
            jsonOutputArray.push(dependencies[key])
        })
        console.log(jsonOutputArray)
    } else if (opts.flat) {
        dependencies = makeFlatDependencyMap(licensecheck(".", path, overrides))
        Object.keys(dependencies).sort().forEach(function (key) {
            console.log(dependencies[key])
        })
    } else {
        treeify.asLines(makeDependencyTree(licensecheck(".", path, overrides)), false, console.log)
    }
}

main()

function isMissing(info) {
    return !info.licenseFile || info.license === "nomatch"
}

function getDescription(info) {
    var file

    var output = {}
    fields.forEach(function fieldforeach(field) {
        if (field === "name") {
            output.name = info.name
            return
        }
        if (field === "version") {
            output.version = info.packageInfo.version
            return
        }
        if (field === "nameversion") {
            output.nameversion = info.name + "@" + info.packageInfo.version
            return
        }
        if (field === "dependencies") {
            output.dependencies = info.deps.map(function (dep) { return dep.name + "@" + dep.packageInfo.version }).join(",")
            return
        }
        if (field === "license") {
            file = info.licenseFile
            if (file) {
                if (info.license === "nomatch") {
                    output.license = chalk.yellow("unmatched")
                } else if (highlight && highlight.test(info.license)) {
                    output.license = chalk.magenta(info.license)
                } else {
                    output.license = chalk.green(info.license)
                }
            } else {
                output.license = chalk.red("unknown")
            }
            return
        }
        if (field === "licensefile" || field === "simplelicensefile") {
            file = info.licenseFile
            if (file) {
                if (field === "simplelicensefile") {
                    file = file.replace(/\/node_modules\//g, " ~ ")
                }
                if (info.license === "nomatch") {
                    output.licensefile = chalk.yellow(file)
                } else {
                    output.licensefile = file
                }
            } else {
                output.licensefile = chalk.red("no license found")
            }
            return
        }
        // A possible future enhancement is to support dot-delimited paths,
        // such as author.name.  And/or to support attaching the full
        // packaginfo.
        if (typeof info.packageInfo[field] === "string") {
            output[field] = info.packageInfo[field]
            return
        } else {
            output[field] = "UNKNOWN"
            return
        }
    })

    if (opts.json) {
        return output
    }
    var outputArr = []
    for (var f in output) {
        outputArr.push(output[f])
    }
    return outputArr.join(sep)
}


function makeDependencyTree(info) {
    if (opts.missing_only && !isMissing(info) && !info.deps.some(isMissing)) {
        return {}
    }
    var key = getDescription(info)
    var tree = {}
    var dependencies = tree[key] = {}
    info.deps.map(makeDependencyTree).forEach(function (dependency) {
        Object.keys(dependency).forEach(function (k) {
            dependencies[k] = dependency[k]
        })
    })
    return tree
}

function makeFlatDependencyMap(info) {
    var map = {}
    if (!opts.missing_only || isMissing(info)) {
        map[info.name + "@" + info.packageInfo.version] = getDescription(info)
    }
    info.deps.forEach(function (dep) {
        var subMap = makeFlatDependencyMap(dep)
        Object.keys(subMap).forEach(function (key) {
            if (!map[key]) {
                map[key] = subMap[key]
            }
        })
    })
    return map
}
