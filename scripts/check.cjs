const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw Error('Duplicate HTML IDs');
for (const [, target] of html.matchAll(/(?:src|href|poster)="([^"]+)"/g)) {
  if (target.startsWith('#')) {
    if (!ids.includes(target.slice(1))) throw Error(`Missing anchor: ${target}`);
    continue;
  }
  if (/^(https?:|mailto:)/.test(target)) continue;
  if (!fs.existsSync(path.join(root, target))) throw Error(`Missing file: ${target}`);
}
for (const [, references] of html.matchAll(/aria-(?:controls|labelledby)="([^"]+)"/g)) {
  for (const id of references.split(/\s+/)) {
    if (!ids.includes(id)) throw Error(`Missing interaction target: ${id}`);
  }
}
for (const file of fs.readdirSync(path.join(root, 'assets/css'))) {
  const directory = path.join(root, 'assets/css');
  const css = fs.readFileSync(path.join(directory, file), 'utf8');
  for (const match of css.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^\s)]+))\s*\)/g)) {
    const target = match[1] || match[2] || match[3];
    if (/^(data:|https?:|#)/.test(target)) continue;
    if (!fs.existsSync(path.resolve(directory, target.split(/[?#]/)[0]))) throw Error(`Missing CSS asset in ${file}: ${target}`);
  }
}
for (const file of fs.readdirSync(path.join(root, 'assets/js'))) {
  new vm.Script(fs.readFileSync(path.join(root, 'assets/js', file), 'utf8'), { filename: file });
}
console.log('PASS: local assets, navigation anchors, interaction targets, unique IDs and JavaScript syntax');
