(function () {
  var fs = require('fs'); 
  var sql = require('sql.js'); //https://github.com/kripken/sql.js

  function DB(filename) {    
        this.db = null;
        this.load(filename);
    }

    DB.prototype.load = function(filename) {
      this.filename = filename;
      var filebuffer = fs.readFileSync(this.filename);
      this.db = new SQL.Database(filebuffer);
    }

     DB.prototype.save = function () {
         var data = this.db.export();
         var buffer = new Buffer(data);
         fs.writeFileSync(this.filename, buffer);
     }

     DB.prototype.getByName = function(name) {
      var stmt = this.db.prepare("SELECT * FROM channels WHERE name = :name", {':name' : name});
      // stmt.step();
      // channel =  stmt.getAsObject();
      // console.log(channel);
      // stmt.free();
      // return channel;
      // channels = [];
      channels = [];
      if (stmt.step()) {
          channel = stmt.getAsObject();
          return channel;
      }      
      return null;
     }

    module.exports = DB;
}());

// (function () {
//  var fs = require('fs');
//  var sql = require('sql.js'); 

//  function DB() {

//  }



//  DB.prototype.parseLine = function(line) {
//  }

//  DB.prototype.load = function(filename) {
//   var filebuffer = fs.readFileSync(filename);
//   var db = new SQL.Database(filebuffer);    
//   return db;
// }

// module.exports = DB;
// }());