const monguito = require('mongoose');

require('dotenv').config({ path: '../.env' });
module.exports = () => monguito.connect(process.env.MONGODB_URI);
 