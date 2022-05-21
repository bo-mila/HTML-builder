const fs = require('fs');
const path = require('path');
const { stdout } = process;

const fileName = 'text.txt';

const stream = fs.createReadStream(path.join(__dirname, fileName), 'utf-8');

let data = '';

stream.on('data', chunk => data += chunk);
stream.on('end', () => stdout.write(data));
stream.on('error', error => console.log('Error', error.message));
