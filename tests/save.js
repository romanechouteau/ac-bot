// var mysql = require('mysql');
 
// console.log('Get connection ...');
 
// var conn = mysql.createConnection({
//   database: 'animalcrossing',
//   host: "localhost",
//   user: "root",
//   password: ""
// });
 
// conn.connect(function(err) {
//   if (err) throw err;
//   console.log("Connected!");

//   var sql1 = "CREATE DATABASE animalcrossing";
//   var sql2 = "CREATE TABLE Birthdays " +
//         " (Id INT not null AUTO_INCREMENT, " +
//         " pageId INT(50), " +
//         " Birthday VARCHAR(255), " +
//         " PRIMARY KEY (Id) )";
//     conn.query(sql2, function(err, results) {
//         if (err) throw err;
//         console.log("Table Birthdays created");
//     });
// });

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

    request('https://nookipedia.com/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category%3A%20Villagers&cmlimit=500', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      const nrmvillagers = JSON.parse(body)["query"]["categorymembers"];
      request('https://nookipedia.com/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category%3A%20Special_Characters&cmlimit=500', async function (error, response, body) {
      if (!error && response.statusCode == 200) {
        const spvillagers = JSON.parse(body)["query"]["categorymembers"];
        const villagers = nrmvillagers.concat(spvillagers);
        for (var i=0; i<villagers.length; i++) {
            if (!villagers[i]["title"].includes("Category:") && !villagers[i]["title"].includes("User:") && !villagers[i]["title"].includes("List") && !villagers[i]["title"].includes("Nookipedia:") && !villagers[i]["title"].includes("Characters")) {
            let pageid = villagers[i]["pageid"];
            request(`https://nookipedia.com//w/api.php?action=query&format=json&prop=revisions&rvprop=content&pageids=${pageid}&rvsection=0&rvslots=main`, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                let data = JSON.parse(body);
                data = data['query']['pages'][pageid]['revisions'][0]['slots']['main']['*'].split("|");
                let index = data.findIndex(element => element.includes("birthday"));
                if (index != -1) {
                  let birthday = data[index].replace("birthday = ","");
                  birthday = birthday.replace("birthday= ","");
                  birthday = birthday.replace("birthday=","");
                  if (data[index].includes("[")) {
                    birthday = data[index + 1];
                  }
                  if (birthday.includes("<")) {
                    birthday = birthday.split("<")[0];
                  }
                  if (birthday.includes("]")) {
                    birthday = birthday.split("]")[0];
                  }
                  if (birthday.includes("th")) {
                    birthday = birthday.split("th")[0];
                  }
                  var sql3 = "Insert into Birthdays (Id, pageId, Birthday) " //
            +
            " Values (NULL, '" + pageid + "', '" + birthday + "')";
 
    conn.query(sql3, function(err, results) {
        if (err) throw err;
        console.log("Insert a record!");
    });
                }
              }
          });
          }
        }
      }
    });  
  }
});
});
