require('dotenv').config();

const { startJsonRuntime } = require('./server/runtime');

startJsonRuntime({
    rootDir: __dirname,
    env: process.env
});
