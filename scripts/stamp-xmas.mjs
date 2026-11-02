// 크리스마스 소원 마을 모듈 import 주소에 내용 해시를 붙인다 — 브라우저가 예전 모듈을 캐시에서 쓰지 않도록.
// 모듈 파일을 고친 뒤 실행: node scripts/stamp-xmas.mjs
import fs from 'fs'; import crypto from 'crypto';
const dir = 'public/games/xmas-village/', html = dir + 'index.html';
let s = fs.readFileSync(html, 'utf8');
for (const f of ['village.js', 'ornaments.js', 'snowman.js']) {
  const h = crypto.createHash('sha1').update(fs.readFileSync(dir + f)).digest('hex').slice(0, 8);
  s = s.replace(new RegExp(`'\\./${f.replace('.', '\\.')}(\\?v=[0-9a-f]+)?'`, 'g'), `'./${f}?v=${h}'`);
}
fs.writeFileSync(html, s);
console.log(s.match(/from '\.\/[a-z]+\.js\?v=[0-9a-f]+'/g).join('\n'));
