const fs = require('fs');
const path = require('path');

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.temp_ag_kit') {
        getFiles(name, fileList);
      }
    } else {
      if (file.endsWith('.html')) {
        fileList.push(name);
      }
    }
  });
  return fileList;
}

const rootDir = process.cwd();
const htmlFiles = getFiles(rootDir);

const results = htmlFiles.map(file => {
  const content = fs.readFileSync(file, 'utf8');
  const titleMatch = content.match(/<title>(.*?)<\/title>/i);
  const h1Match = content.match(/<h1>(.*?)<\/h1>/i);
  
  return {
    path: path.relative(rootDir, file),
    title: titleMatch ? titleMatch[1] : 'No title',
    h1: h1Match ? h1Match[1].replace(/<[^>]*>?/gm, '').trim() : 'No H1'
  };
});

console.log(JSON.stringify(results, null, 2));
