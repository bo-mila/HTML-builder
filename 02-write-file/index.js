const fs = require('fs');
const path = require('path');
const { stdin, stdout } = process;

const filePath = path.join(__dirname, './text.txt');

const cbError = (file, err) => {
  if (!err) return;
  console.log(`Something wrong with file ${file}`);
  console.log(err);
  process.exit(0);
};

const onExit = () => {
  console.log('Ok. Goodbye ;)');
  process.exit(0);
  
};

fs.writeFile(filePath, '', (err) => {
  if (!err) return;
  const cb = cbError.bind(null, filePath);
  cb(err);
});

const onData = (data, file) => {
  if (data.toString().trim() === 'exit') onExit();
  const cb = cbError.bind(null, file);
  fs.appendFile(filePath, data, cb);
};

stdout.write('Please, type your text:\n');
stdin.on('data', data => onData(data, filePath));

process.on('SIGINT', onExit);
