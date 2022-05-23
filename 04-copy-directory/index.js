const fs = require('fs');
const path = require('path');
const { stdout } = require('process');

const folderPath = path.join(__dirname, 'files');
const copyFolderPath = path.join(__dirname, 'files-copy');

const cleanFolder = async (folder) => {
  const directoryContent = await fs.promises.readdir(folder, { withFileTypes: true });
  const list = directoryContent.map(async (item) => {
    const cleanPath = path.join(folder, item.name);
    if (item.isFile()) await fs.promises.unlink(cleanPath);
    else {
      await cleanFolder(cleanPath);
      await fs.promises.rmdir(cleanPath);
    }
  });
  return Promise.all(list);
};

const createFolder = async (folderPath) => {
  await fs.promises.mkdir(folderPath, { recursive: true });
  await cleanFolder(folderPath);
};

const copyFile = async (filePath, copyFilePath) => {
  const outputStream = fs.createWriteStream(copyFilePath);
  const stream = fs.createReadStream(filePath, 'utf-8');
  for await (const chunk of stream) {
    outputStream.write(chunk);
  }
};

const main = async (folderPath = '.', copyFolderPath) => {
  const directoryContent = await fs.promises.readdir(folderPath, { withFileTypes: true });
  directoryContent.forEach(async (item) => {
    const pathFrom = path.join(folderPath, item.name);
    const pathTo = path.join(copyFolderPath, item.name);
    if (item.isFile()) {
      copyFile(pathFrom, pathTo);
    }
    else {
      await createFolder(pathTo);
      await main(pathFrom, pathTo);
    }
  });
};

const errExit = (error) => {
  stdout.write('Something is wrong\n');
  stdout.write(error.message + '\n');
  process.exit(0);
};

createFolder(copyFolderPath)
  .catch(err => errExit(err))
  .then(() => main(folderPath, copyFolderPath))
  .catch(err => errExit(err))
  .then(() => stdout.write('Hurrah! Files copied\n'));
