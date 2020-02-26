const mysql = require('mysql');
const request = require('request');
 
console.log('Get connection ...');
 
var conn = mysql.createConnection({
  database: 'animalcrossing',
  host: "localhost",
  user: "root",
  password: ""
});
 
conn.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
    
});
