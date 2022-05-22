const fs = require('fs');
const path = require('path');

const folderPath = path.join(__dirname, 'secret-folder');

const renderFileList = (arr) => {
  const list = arr.map(item => `${item.name} - ${item.ext} - ${item.size}\n`);
  return list.join('');
};

async function makeFileList(folderPath = '.') {
  const dirContent = await fs.promises.readdir(folderPath, { withFileTypes: true });
  const promises = dirContent.filter(item => item.isFile()).map(async (item) => {
    const filePath = path.join(folderPath, item.name);
    const { size } = await fs.promises.stat(filePath);
    const ext = path.extname(filePath).substring(1);
    const name = item.name.substring(0, item.name.length - (ext.length + 1));
    return {
      name,
      ext,
      size: size ? `${(size / 1024).toFixed(2)}Kb` : '0Kb',
    };
  });
  return Promise.all(promises);
}

makeFileList(folderPath, { size: true, lineCount: true}).then(data => {
  console.log(renderFileList(data));
}).catch(console.error);
