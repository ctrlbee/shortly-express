var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link.js');

var User = db.Model.extend({
  tableName: 'users',
  defaults: {
    salt: 'noSalt'
  },

  links: function() {
    return this.hasMany(Link);
  },

  initialize: function(){
    //if we include salts, this is where we would create it
  }  
});

module.exports = User;