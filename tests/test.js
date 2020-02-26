const Twitter = require('twitter');
const config = require('./config.js');
const fs = require('fs');
const request = require('request');

const months = ['January','February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

let date = new Date('2020-12-20');
let today = `${months[date.getMonth()]} ${date.getDate()}`;
const birthdays = [];
const errors = [];

function searchBirthday(villagers) {
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
          birthdays.push(birthday);
        }
      } else {
        errors.push(pageid+" : wrong pageid");
        if (response != undefined) {
          console.log(response.statusCode);
        } else if (error != undefined) {
          console.log(error);
        }
        
      }
  });
  }
}
}

function normalVillagers() {
  request('https://nookipedia.com/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category%3A%20Villagers&cmlimit=500', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var nrmvillagers = JSON.parse(body)["query"]["categorymembers"];
      request('https://nookipedia.com/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category%3A%20Special_Characters&cmlimit=500', async function (error, response, body) {
      if (!error && response.statusCode == 200) {
        let spvillagers = JSON.parse(body)["query"]["categorymembers"];
        let bothvillagers = nrmvillagers.concat(spvillagers);
        searchBirthday(bothvillagers);
      }
    });
      
  }
});
}

async function researchVillagers() {
  normalVillagers();
  // const birthdays = normalVillagers();
  // console.log(`L'anniversaire d'aujourd'hui est ${birthdays} !`);
}

researchVillagers();