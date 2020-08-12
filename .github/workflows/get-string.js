var fs = require('fs')
console.log(fs.readFileSync('../../datacalc.js', 'utf-8').match(/(?<=^    "?)([^ "].*[^"])(?="?:)/gm).toString())