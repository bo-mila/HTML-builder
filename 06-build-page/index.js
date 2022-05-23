const fs = require('fs');
const path = require('path');
const { stdout } = require('process');

const srcHtmlFile = path.join(__dirname, 'template.html');
const srcHtmlComponents = path.join(__dirname, 'components');
const srcStyleFile = path.join(__dirname, 'styles');
const srcAssetsFolder = path.join(__dirname, 'assets');
const distFolder = path.join(__dirname, 'project-dist');
const distAssetsFolder = path.join(distFolder, 'assets');
const distHtmlFile = path.join(distFolder, 'index.html');

const errExit = (error) => {
  stdout.write('Something is wrong\n');
  stdout.write(error.message + '\n');
  process.exit(0);
};

const cleanFolder = async (folder) => {
  const directoryContent = await fs.promises.readdir(folder, { withFileTypes: true });
  const list = directoryContent.map(async (item) => {
    const cleanPath = path.join(folder, item.name);
    if (item.isFile()) return await fs.promises.unlink(cleanPath);
    else {
      await cleanFolder(cleanPath);
      return await fs.promises.rmdir(cleanPath);
    }
  });
  return Promise.all(list);
};

const createFolder = async (folderPath, clean = true) => {
  await fs.promises.mkdir(folderPath, { recursive: true });
  if (clean) await cleanFolder(folderPath);
};

const getFileList = async (folder, ext) => {
  const directoryContent = await fs.promises.readdir(folder, { withFileTypes: true });
  const list = [];
  directoryContent.forEach(async (item) => {
    const srcPath = path.join(folder, item.name);
    if (!item.isFile()) {
      const listFromFolder = await getFileList(srcPath, ext);
      list.push(listFromFolder);
    } else {
      const extention = path.extname(srcPath).substring(1);
      if (extention === ext) {
        const name = item.name.substring(0, item.name.length - (ext.length + 1));
        list.push({ name, path: srcPath });
      }
    }
  });
  return list;
};

const createHtml = async (srcHtmlFile, distHtmlFile) => {
  const htmlComponentList = await getFileList(srcHtmlComponents, 'html');
  await fs.promises.writeFile(distHtmlFile, '');
  const rs = fs.createReadStream(srcHtmlFile,'utf8');
  const ws = fs.createWriteStream(distHtmlFile);
  for await (const chunk of rs) {
    let chunkToString = chunk.toString();
    for (let l = 0; l < htmlComponentList.length; l++) {
      let buffer = [];
      if (chunkToString.includes(`{{${htmlComponentList[l].name}}}`)) {
        const rs2 = fs.createReadStream(htmlComponentList[l].path,'utf8');
        for await (const chunk of rs2) {
          buffer.push(chunk.toString());
        }
        chunkToString = await chunkToString.replace(`{{${htmlComponentList[l].name}}}`, buffer.join('\n'));
      }
    }
    ws.write(chunkToString);
  }
};

const createStyle = async (srcStyleFolder, disFolder, bundleStyle) => {
  const bundleStylePath = path.join(disFolder, bundleStyle);
  await fs.promises.writeFile(bundleStylePath, '')
    .catch(err => errExit(err));
  const fileList = await getFileList(srcStyleFolder, 'css')
    .catch(err => errExit(err));
  const buffer = [];
  for await (const file of fileList) {
    const ws = fs.createWriteStream(bundleStylePath);
    const rs = fs.createReadStream(file.path,'utf8');
    rs.on('data', (chunk) => buffer.push(chunk));
    rs.on('error', (error) => errExit(error));
    rs.on('end', () => {
      for (let i = 0; i < buffer.length; i++) {
        ws.write(buffer[i]);
      }
    });
  }
};

const copyFile = async (filePath, copyFilePath) => {
  await fs.promises.copyFile(filePath, copyFilePath);
};

const copyAssets = async (folderPath = '.', copyFolderPath) => {
  await fs.promises.mkdir(copyFolderPath, { recursive: true });
  const directoryContent = await fs.promises.readdir(folderPath, { withFileTypes: true });
  directoryContent.forEach(async (item) => {
    const pathFrom = path.join(folderPath, item.name);
    const pathTo = path.join(copyFolderPath, item.name);
    if (item.isFile()) {
      copyFile(pathFrom, pathTo);
    }
    else {
      await copyAssets(pathFrom, pathTo);
    }
  });
};

createFolder(distFolder)
  .then(() => createHtml(srcHtmlFile, distHtmlFile))
  .then(() => createStyle(srcStyleFile, distFolder, 'style.css'))
  .then(() => copyAssets(srcAssetsFolder, distAssetsFolder))
  .then(() => stdout.write('Project is bundled!'));
