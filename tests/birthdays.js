const config = require('../config.js');
const fs = require('fs');
const request = require('request');
const Twitter = require('twitter');

const months = ['January','February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const twit = new Twitter(config);

let date = new Date();
let monthnumber = date.getMonth();
let daynumber = date.getDate();
let today = `${months[monthnumber]} ${daynumber}`;

function searchBirthday() {
    request(`https://nookipedia.com//w/api.php?action=query&format=json&prop=revisions&rvprop=content&pageids=11642&rvsection=${monthnumber + 1}&rvslots=main`, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var month = JSON.parse(body)["query"]["pages"][11642]["revisions"][0]["slots"]["main"]["*"];
            if (month.includes("Category:")) {
                month = month.split("Category:")[0];
            }
            month = month.split("*").slice(1,month.length);
            var birthdays = {};
            month.forEach(element => {
                element = element.split(/[\s]*[-][\s]*/g);
                var day = element[0].replace("st","").replace("nd","").replace("rd","").replace("th","");
                var person = element[1].replace(/[|].*[\]]/g,"").replace(/[\[]/g,"").replace(/[\]]/g,"").replace(/[\n]/g,"");
                birthdays[day] = person;
            });
            // console.log(birthdays);
            var todaysBirthday = birthdays[daynumber.toString()];
            if (todaysBirthday == undefined) {
              todaysBirthday = "nobody";
            }
            tweetBirthday(todaysBirthday);
        }

    });
}

searchBirthday();

function tweetBirthday(todaysBirthday) {
    let status = {
      status: `Today is ${todaysBirthday}'s birthday! 🎂`
    }

    twit.post('statuses/update', status, function(error, tweet, response) {
      if (!error) {
        console.log(tweet);
      }
    });

}