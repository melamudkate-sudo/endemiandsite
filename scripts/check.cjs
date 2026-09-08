const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw Error('Duplicate HTML IDs');
for (const [, target] of html.matchAll(/(?:src|href|poster)="([^"]+)"/g)) {
  if (/^(https?:|#|mailto:)/.test(target)) continue;
  if (!fs.existsSync(path.join(root, target))) throw Error(`Missing file: ${target}`);
}
for (const file of fs.readdirSync(path.join(root, 'assets/js'))) {
  new vm.Script(fs.readFileSync(path.join(root, 'assets/js', file), 'utf8'), { filename: file });
}
console.log('PASS: local links, unique IDs and JavaScript syntax');
