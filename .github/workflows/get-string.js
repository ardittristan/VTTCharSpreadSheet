var fs = require('fs')
var object = fs.readFileSync('datacalc.js', 'utf-8')
var entries = object.match(/(?<=^    "?)([^ "].*[^"])(?="?:)/gm)
console.log(`"{ exports: "${entries.toString()}" }"`)