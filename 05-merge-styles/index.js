const fs = require('fs');
const path = require('path');
const { stdout } = require('process');

const srcFolder = path.join(__dirname, 'styles');
const disFolder = path.join(__dirname, 'project-dist');
const bundleStyle = 'bundle.css';
const ext = 'css';

const getStyleFileList = async (folder, ext) => {
  const directoryContent = await fs.promises.readdir(folder, { withFileTypes: true });
  const list = [];
  directoryContent.forEach(async (item) => {
    const srcPath = path.join(folder, item.name);
    if (!item.isFile()) list.push(...await getStyleFileList(srcPath, ext));
    if (path.extname(srcPath).substring(1) === ext) list.push(srcPath);
  });
  return list;
};

const bundleFile = async (srcFolder, disFolder, bundleStyle, ext) => {
  const bundleStylePath = path.join(disFolder, bundleStyle);
  await fs.promises.writeFile(bundleStylePath, '')
    .catch(err => errExit(err));
  const fileList = await getStyleFileList(srcFolder, ext)
    .catch(err => errExit(err));
  const buffer = [];
  for await (const file of fileList) {
    const writeableStream = fs.createWriteStream(bundleStylePath);
    const readableStream = fs.createReadStream(file,'utf8');
    readableStream.on('data', (chunk) => buffer.push(chunk));
    readableStream.on('error', (error) => errExit(error));
    readableStream.on('end', () => {
      for (let i = 0; i < buffer.length; i++) {
        writeableStream.write(buffer[i]);
      }
    });
  }
};

const errExit = (error) => {
  stdout.write('Something is wrong\n');
  stdout.write(error.message + '\n');
  process.exit(0);
};

bundleFile(srcFolder, disFolder, bundleStyle, ext).then(() => stdout.write('Styles is bundled!'));
