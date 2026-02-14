const monguito = require('mongoose');
require('dotenv').config();

module.exports = function() {
  monguito.connect(process.env.MONGODB_URI);
};
