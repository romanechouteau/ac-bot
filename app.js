const Twitter = require('twitter');
const config = require('./config.js');
const fs = require('fs');
const request = require('request');
const asyncLoop = require('node-async-loop');

const category = ['Music', 'Characters', 'Events', 'Fossils/Artwork', 'Locations', 'Fish', 'Bugs'];
const months = ['January','February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

let twit = new Twitter(config);

let date = new Date();

let jour = date.getDay();

let monthnumber = date.getMonth();
let daynumber = date.getDate();
let today = `${months[monthnumber]} ${daynumber}`;

// USEFUL FUNCTIONS

// DOWNLOAD IMAGE

var download = function (uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

// RECHERCHE PROPRIETE

function researchProp(characterData, lowerProp, upperProp) {
  var prop = "";
  characterData = characterData.replace(/[\t]/g, "");
  characterData = characterData.replace("order#", "order");
  characterData = characterData.replace("owned by", "ownedby");
  characterData = characterData.replace("scientific name", "sciname");
  characterData = characterData.replace("image1", "image");
  characterData = characterData.replace(/(\s)+/g, " ");
  if (characterData.includes(lowerProp) || characterData.includes(upperProp)) {
    var indexprop = characterData.split(/([|][A-z]+[=])/).findIndex(element => (element.includes('|' + lowerProp + '=') || element.includes('|' + upperProp + '=')));
    if (indexprop + 1 <= 0) {
      if (characterData.split(/([{][A-z]+[|])/).findIndex(element => (element.includes('{' + lowerProp + '|') || element.includes('{' + upperProp + '|'))) <= 0) {
        indexprop = characterData.split(/([|][A-z]+(\s=))/).findIndex(element => (element.includes('|' + lowerProp + ' =') || element.includes('|' + upperProp + ' =')));
        prop = characterData.split(/([|][A-z]+(\s=))/)[indexprop + 2];
      } else {
        indexprop = characterData.split(/([{][A-z]+[|])/).findIndex(element => (element.includes('{' + lowerProp + '|')) || element.includes('{' + upperProp + '|'));
        prop = characterData.split(/([{][A-z]+[|])/)[indexprop + 1].split("|")[0];
      }
    } else {
      prop = characterData.split(/([|][A-z]+[=])/)[indexprop + 1];
    }
    if (prop != undefined && prop != "" && prop != "/n") {
      prop = prop.trim();
      prop = prop.split("}")[0];
      prop = prop.split("({{")[0];
      prop = prop.replace(/({{tt\|).+[|]/, "").replace(/(<br>)/g, " ").replace(/(\n)/g, "").replace(/(\t)/g, "").replace(/(\[\[)/g, "").replace(/(\]\])/g, "").replace(/[<].+[>]/g, "");

      if (lowerProp == "artist") {
        prop = prop.split("|")[0];
      }
      if (lowerProp == "species") {
        prop = prop.replace("(species)", "");
        prop = prop.split("|")[0];
      }
      if (lowerProp == "image") {
        prop = prop.split("{")[0];
      }

      if (prop.includes("Wikipedia:")) {
        prop = prop.replace("Wikipedia:", "");
        prop = prop.split("|")[0];
      }

      if (prop.charAt(0) == " ") {
        prop = prop.substr(1, prop.length - 1);
      }
    } else {
      prop = "no prop";
    }
    return prop.charAt(0).toUpperCase() + prop.slice(1).trim();
  } else {
    prop = "no prop";
    return prop.charAt(0).toUpperCase() + prop.slice(1);
  }

}

// BIRTHDAYS

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

// RANDOMS

// CHARACTER

function randomCharacter() {
  request('https://nookipedia.com/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category%3A%20Characters&cmlimit=500&cmtype=page', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var characters = JSON.parse(body)["query"]["categorymembers"];
      var index = Math.floor(Math.random() * (characters.length - 1));
      console.log(characters[index]);
      var pageid = characters[index]["pageid"];
      request('https://nookipedia.com//w/api.php?action=query&format=json&prop=revisions&rvprop=content&rvsection=0&rvslots=*&pageids=' + pageid, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var characterData = JSON.parse(body)["query"]["pages"][pageid]["revisions"][0]["slots"]["main"]["*"];

          // NAME
          var name = JSON.parse(body)["query"]["pages"][pageid]["title"];
          console.log(name);

          // GENDER
          var gender = researchProp(characterData, "gender", "Gender");
          console.log(gender);

          // SPECIES
          var species = researchProp(characterData, "species", "Species");
          console.log(species);

          // PERSONALITY
          var pers = researchProp(characterData, "pers", "Pers");
          console.log(pers);

          // QUOTE
          var quote = researchProp(characterData, "quote", "Quote");;
          console.log(quote);

          // IMAGE
          if (researchProp(characterData, "image", "Image").includes("File:")) {
            var imagename = researchProp(characterData, "image", "Image").split("|")[0];
            request('https://nookipedia.com/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + imagename, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                console.log(imagename);
                var imageurl = JSON.parse(body)["query"]["pages"];
                var pageid = Object.keys(imageurl)[0];
                imageurl = imageurl[pageid]["imageinfo"][0]["url"];
                console.log(imageurl);
                tweetCharacter(name, gender, species, pers, quote, imageurl);
              }
            });
          } else if (researchProp(characterData, "image", "Image") != "No prop") {
            var imagename = "File: " + researchProp(characterData, "image", "Image");
            if (imagename != "File: No prop") {
              request('https://nookipedia.com/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + imagename, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  var imageurl = JSON.parse(body)["query"]["pages"];
                  var pageid = Object.keys(imageurl)[0];
                  imageurl = imageurl[pageid]["imageinfo"][0]["url"];
                  console.log(imageurl);
                  tweetCharacter(name, gender, species, pers, quote, imageurl);
                }
              });
            }

          } else {
            imageurl = "No image";
            tweetCharacter(name, gender, species, pers, quote, imageurl);
          }


        }
      });
    }
  });
}

// EVENT

function randomEvent() {
  request('https://nookipedia.com/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category%3A%20Events&cmlimit=500&cmtype=page', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var events = JSON.parse(body)["query"]["categorymembers"];
      events = events.filter(function (value, index, arr) {
        return !value['title'].includes('List');
      });
      var index = Math.floor(Math.random() * (events.length - 1));
      console.log(events[index]);
      var pageid = events[index]["pageid"];
      request('https://nookipedia.com//w/api.php?action=query&format=json&prop=pageprops&pageids=' + pageid, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          let eventDesc = JSON.parse(body)["query"]["pages"][pageid]["pageprops"]["description"];
          eventDesc = eventDesc.replace(/(&#91;)/g, "").replace(/(1&#93;)/g, "").replace(/(2&#93;)/g, "");
          eventDesc = eventDesc.replace(/("Tent" redirects here\.\s)/g, "");
          let name = JSON.parse(body)["query"]["pages"][pageid]["title"];
          let text = `~ ${days[jour]} : ${category[jour]} ~\n\nName : ${name}`;

          if (eventDesc.length > (280 - text.length)) {
            let eventDescTab = [];
            eventDescTemp = eventDesc.substring(0, 279 - text.length);
            if (eventDescTemp.includes(".")) {
              let lastDot = eventDescTemp.lastIndexOf(".");
              eventDescTemp = eventDesc.substring(0, lastDot + 1);
            }
            text = text + "\n" + eventDescTemp.trim();
            eventDesc = eventDesc.replace(eventDescTemp, "");
            // console.log(eventDescTemp);
            while (eventDesc != "") {
              eventDescTemp = eventDesc.substring(0, 279 - "@CrossingEvents\n".length);
              if (eventDescTemp.includes(".")) {
                let lastDot = eventDescTemp.lastIndexOf(".");
                eventDescTemp = eventDesc.substring(0, lastDot + 1);
              }
              eventDescTab.push(eventDescTemp.trim());
              eventDesc = eventDesc.replace(eventDescTemp, "");

            }
            tweetDescThread(text, "No image", eventDescTab);
          } else {
            text = text + "\n" + eventDesc;
            tweetDesc(text, "No image");
          }


        }
      });
    }
  });
}

// FOSSIL / ARTWORK

function randomFossilArtwork() {
  var type = Math.floor(Math.random() * 2);
  if (type == 0) {
    request('https://nookipedia.com/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category%3A%20Fossils&cmlimit=500&cmtype=page', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var fossils = JSON.parse(body)["query"]["categorymembers"];
        var index = Math.floor(Math.random() * (fossils.length - 1));
        console.log(fossils[index]);
        var pageid = fossils[index]["pageid"];
        request('https://nookipedia.com//w/api.php?action=query&format=json&prop=revisions&rvprop=content&rvsection=0&rvslots=*&pageids=' + pageid, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var fossilsData = JSON.parse(body)["query"]["pages"][pageid]["revisions"][0]["slots"]["main"]["*"];

            // NAME
            var name = JSON.parse(body)["query"]["pages"][pageid]["title"];
            console.log(name);

            // SCIENTIFIC NAME
            var sciname = researchProp(fossilsData, "sciname", "Sciname");
            console.log(sciname);

            // SECTIONS
            var sections = researchProp(fossilsData, "sections", "Sections");;
            console.log(sections);

            // PERIOD
            var period = researchProp(fossilsData, "period", "Period");;
            console.log(period);

            // LENGTH
            var length = researchProp(fossilsData, "length", "Length");;
            console.log(length);

            // PRICE
            var price = researchProp(fossilsData, "price", "Price");;
            console.log(price);

            // IMAGE
            if (researchProp(fossilsData, "image", "Image").includes("File:")) {
              var imagename = researchProp(fossilsData, "image", "Image").split("|")[0];
              request('https://nookipedia.com/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + imagename, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  console.log(imagename);
                  var imageurl = JSON.parse(body)["query"]["pages"];
                  var pageid = Object.keys(imageurl)[0];
                  imageurl = imageurl[pageid]["imageinfo"][0]["url"];
                  console.log(imageurl);
                  tweetFossil(name, sciname, sections, period, length, price, imageurl);
                }
              });
            } else if (researchProp(fossilsData, "image", "Image") != "No prop") {
              var imagename = "File: " + researchProp(fossilsData, "image", "Image");
              if (imagename != "File: No prop") {
                request('https://nookipedia.com/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + imagename, function (error, response, body) {
                  if (!error && response.statusCode == 200) {
                    var imageurl = JSON.parse(body)["query"]["pages"];
                    var pageid = Object.keys(imageurl)[0];
                    imageurl = imageurl[pageid]["imageinfo"][0]["url"];
                    console.log(imageurl);
                    tweetFossil(name, sciname, sections, period, length, price, imageurl);
                  }
                });
              }

            } else {
              imageurl = "No image";
              tweetFossil(name, sciname, sections, period, length, price, imageurl);
            }

          }
        });
      }
    });
  } else {
    request('https://nookipedia.com/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category%3A%20Artwork&cmlimit=500&cmtype=page', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var artwork = JSON.parse(body)["query"]["categorymembers"];
        artwork = artwork.filter(function (value, index, arr) {
          return !value['title'].includes('Forgery');
        });
        var index = Math.floor(Math.random() * (artwork.length - 1));
        console.log(artwork[index]);
        var pageid = artwork[index]["pageid"];
        request('https://nookipedia.com//w/api.php?action=query&format=json&prop=revisions&rvprop=content&rvsection=0&rvslots=*&pageids=' + pageid, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var artworkData = JSON.parse(body)["query"]["pages"][pageid]["revisions"][0]["slots"]["main"]["*"];
            artworkData = artworkData.replace("real name", "realname");
            // NAME
            var name = JSON.parse(body)["query"]["pages"][pageid]["title"];
            console.log(name);

            // SCIENTIFIC NAME
            var realname = researchProp(artworkData, "realname", "Realname");
            console.log(realname);

            // SECTIONS
            var artist = researchProp(artworkData, "artist", "Artist");;
            console.log(artist);

            // IMAGE
            if (researchProp(artworkData, "image", "Image").includes("File:")) {
              var imagename = researchProp(artworkData, "image", "Image").split("|")[0];
              request('https://nookipedia.com/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + imagename, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  console.log(imagename);
                  var imageurl = JSON.parse(body)["query"]["pages"];
                  var pageid = Object.keys(imageurl)[0];
                  imageurl = imageurl[pageid]["imageinfo"][0]["url"];
                  console.log(imageurl);
                  tweetArtwork(name, realname, artist, imageurl)
                }
              });
            } else if (researchProp(artworkData, "image", "Image") != "No prop") {
              var imagename = "File: " + researchProp(artworkData, "image", "Image");
              if (imagename != "File: No prop") {
                request('https://nookipedia.com/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + imagename, function (error, response, body) {
                  if (!error && response.statusCode == 200) {
                    var imageurl = JSON.parse(body)["query"]["pages"];
                    var pageid = Object.keys(imageurl)[0];
                    imageurl = imageurl[pageid]["imageinfo"][0]["url"];
                    console.log(imageurl);
                    tweetArtwork(name, realname, artist, imageurl)
                  }
                });
              }

            } else {
              imageurl = "No image";
              tweetArtwork(name, realname, artist, imageurl)
            }
          }
        });
      }
    });
  }
}

// LOCATION

function randomLocation() {
  request('https://nookipedia.com/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category%3A%20Locations&cmlimit=500&cmtype=page', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var locations = JSON.parse(body)["query"]["categorymembers"]
      var index = Math.floor(Math.random() * (locations.length - 1));
      console.log(locations[index]);
      var pageid = locations[index]["pageid"];
      request('https://nookipedia.com//w/api.php?action=query&format=json&prop=pageprops&pageids=' + pageid, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          let locationDesc = JSON.parse(body)["query"]["pages"][pageid]["pageprops"]["description"];
          let name = JSON.parse(body)["query"]["pages"][pageid]["title"];
          let text = `~ ${days[jour]} : ${category[jour]} ~\n\nName : ${name}`;


          request('https://nookipedia.com//w/api.php?action=query&format=json&prop=revisions&rvprop=content&rvsection=0&rvslots=*&pageids=' + pageid, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var artworkData = JSON.parse(body)["query"]["pages"][pageid]["revisions"][0]["slots"]["main"]["*"];
            artworkData = artworkData.replace("real name", "realname");

            // IMAGE
            if (researchProp(artworkData, "image", "Image").includes("File:")) {
              var imagename = researchProp(artworkData, "image", "Image").split("|")[0];
              request('https://nookipedia.com/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + imagename, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  console.log(imagename);
                  var imageurl = JSON.parse(body)["query"]["pages"];
                  var pageid = Object.keys(imageurl)[0];
                  imageurl = imageurl[pageid]["imageinfo"][0]["url"];
                  console.log(imageurl);
                  if (locationDesc.length > (280 - text.length)) {
                    let locationDescTab = [];
                    locationDescTemp = locationDesc.substring(0, 279 - text.length);
                    if (locationDescTemp.includes(".")) {
                      let lastDot = locationDescTemp.lastIndexOf(".");
                      locationDescTemp = locationDesc.substring(0, lastDot + 1);
                    }
                    text = text + "\n" + locationDescTemp.trim();
                    locationDesc = locationDesc.replace(locationDescTemp, "");
                    // console.log(locationDescTemp);
                    while (locationDesc != "") {
                      locationDescTemp = locationDesc.substring(0, 279 - "@CrossingEvents\n".length);
                      if (locationDescTemp.includes(".")) {
                        let lastDot = locationDescTemp.lastIndexOf(".");
                        locationDescTemp = locationDesc.substring(0, lastDot + 1);
                      }
                      locationDescTab.push(locationDescTemp.trim());
                      locationDesc = locationDesc.replace(locationDescTemp, "");
        
                    }
                    tweetDescThread(text, imageurl, locationDescTab);
                  } else {
                    text = text + "\n" + locationDesc;
                    tweetDesc(text, imageurl);
                  }
                }
              });
            } else if (researchProp(artworkData, "image", "Image") != "No prop") {
              var imagename = "File: " + researchProp(artworkData, "image", "Image");
              if (imagename != "File: No prop") {
                request('https://nookipedia.com/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + imagename, function (error, response, body) {
                  if (!error && response.statusCode == 200) {
                    var imageurl = JSON.parse(body)["query"]["pages"];
                    var pageid = Object.keys(imageurl)[0];
                    imageurl = imageurl[pageid]["imageinfo"][0]["url"];
                    console.log(imageurl);
                    if (locationDesc.length > (280 - text.length)) {
                      let locationDescTab = [];
                      locationDescTemp = locationDesc.substring(0, 279 - text.length);
                      if (locationDescTemp.includes(".")) {
                        let lastDot = locationDescTemp.lastIndexOf(".");
                        locationDescTemp = locationDesc.substring(0, lastDot + 1);
                      }
                      text = text + "\n" + locationDescTemp.trim();
                      locationDesc = locationDesc.replace(locationDescTemp, "");
                      // console.log(locationDescTemp);
                      while (locationDesc != "") {
                        locationDescTemp = locationDesc.substring(0, 279 - "@CrossingEvents\n".length);
                        if (locationDescTemp.includes(".")) {
                          let lastDot = locationDescTemp.lastIndexOf(".");
                          locationDescTemp = locationDesc.substring(0, lastDot + 1);
                        }
                        locationDescTab.push(locationDescTemp.trim());
                        locationDesc = locationDesc.replace(locationDescTemp, "");
          
                      }
                      tweetDescThread(text, imageurl, locationDescTab);
                    } else {
                      text = text + "\n" + locationDesc;
                      tweetDesc(text, imageurl);
                    }
                  }
                });
              }

            } else {
              imageurl = "No image";
              if (locationDesc.length > (280 - text.length)) {
                let locationDescTab = [];
                locationDescTemp = locationDesc.substring(0, 279 - text.length);
                if (locationDescTemp.includes(".")) {
                  let lastDot = locationDescTemp.lastIndexOf(".");
                  locationDescTemp = locationDesc.substring(0, lastDot + 1);
                }
                text = text + "\n" + locationDescTemp.trim();
                locationDesc = locationDesc.replace(locationDescTemp, "");
                // console.log(locationDescTemp);
                while (locationDesc != "") {
                  locationDescTemp = locationDesc.substring(0, 279 - "@CrossingEvents\n".length);
                  if (locationDescTemp.includes(".")) {
                    let lastDot = locationDescTemp.lastIndexOf(".");
                    locationDescTemp = locationDesc.substring(0, lastDot + 1);
                  }
                  locationDescTab.push(locationDescTemp.trim());
                  locationDesc = locationDesc.replace(locationDescTemp, "");
    
                }
                tweetDescThread(text, imageurl, locationDescTab);
              } else {
                text = text + "\n" + locationDesc;
                tweetDesc(text, imageurl);
              }
            }
          }
        });


        }
      });
    }
  });
}

// FISH

function randomFish() {
  request('https://nookipedia.com/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category%3A%20Fish&cmlimit=500&cmtype=page', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var fish = JSON.parse(body)["query"]["categorymembers"];
      var index = Math.floor(Math.random() * (fish.length - 1));
      var pageid = fish[index]["pageid"];
      request('https://nookipedia.com//w/api.php?action=query&format=json&prop=revisions&rvprop=content&rvsection=0&rvslots=*&pageids=' + pageid, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var fishData = JSON.parse(body)["query"]["pages"][pageid]["revisions"][0]["slots"]["main"]["*"];

          // NAME
          var name = JSON.parse(body)["query"]["pages"][pageid]["title"];
          console.log(name);

          // TIMEYEAR
          var timeyear = researchProp(fishData, "timeyear", "Timeyear");
          console.log(timeyear);

          // TIMEDAY
          var timeday = researchProp(fishData, "timeday", "Timeday");;
          console.log(timeday);

          // FOUND
          var found = researchProp(fishData, "found", "Found");;
          console.log(found);

          // SIZE
          var size = researchProp(fishData, "size", "Size");;
          console.log(size);

          // SHADOW
          var shadow = researchProp(fishData, "shadow", "Shadow");;
          console.log(shadow);

          // RARITY
          var rarity = researchProp(fishData, "rarity", "Rarity");;
          console.log(rarity);

          // PRICE
          var price = researchProp(fishData, "price", "Price");;
          console.log(price);

          // IMAGE
          if (researchProp(fishData, "image", "Image").includes("File:")) {
            var imagename = researchProp(fishData, "image", "Image").split("|")[0];
            request('https://nookipedia.com/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + imagename, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                console.log(imagename);
                var imageurl = JSON.parse(body)["query"]["pages"];
                var pageid = Object.keys(imageurl)[0];
                imageurl = imageurl[pageid]["imageinfo"][0]["url"];
                console.log(imageurl);
                tweetFishOrBug(name, timeyear, timeday, found, size, shadow, rarity, price, imageurl);
              }
            });
          } else if (researchProp(fishData, "image", "Image") != "No prop") {
            var imagename = "File: " + researchProp(fishData, "image", "Image");
            if (imagename != "File: No prop") {
              request('https://nookipedia.com/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + imagename, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  var imageurl = JSON.parse(body)["query"]["pages"];
                  var pageid = Object.keys(imageurl)[0];
                  imageurl = imageurl[pageid]["imageinfo"][0]["url"];
                  console.log(imageurl);
                  tweetFishOrBug(name, timeyear, timeday, found, size, shadow, rarity, price, imageurl);
                }
              });
            }

          } else {
            imageurl = "No image";
            tweetFishOrBug(name, timeyear, timeday, found, size, shadow, rarity, price, imageurl);
          }


        }
      });
    }
  });
}

// BUG

function randomBug() {
  request('https://nookipedia.com/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category%3A%20Bugs&cmlimit=500&cmtype=page', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var bugs = JSON.parse(body)["query"]["categorymembers"];
      var index = Math.floor(Math.random() * (bugs.length - 1));
      var pageid = bugs[index]["pageid"];
      request('https://nookipedia.com//w/api.php?action=query&format=json&prop=revisions&rvprop=content&rvsection=0&rvslots=*&pageids=' + pageid, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var bugsData = JSON.parse(body)["query"]["pages"][pageid]["revisions"][0]["slots"]["main"]["*"];

          // NAME
          var name = JSON.parse(body)["query"]["pages"][pageid]["title"];
          console.log(name);

          // TIMEYEAR
          var timeyear = researchProp(bugsData, "timeyear", "Timeyear");
          console.log(timeyear);

          // TIMEDAY
          var timeday = researchProp(bugsData, "timeday", "Timeday");;
          console.log(timeday);

          // FOUND
          var found = researchProp(bugsData, "found", "Found");;
          console.log(found);

          // SIZE
          var size = researchProp(bugsData, "size", "Size");;
          console.log(size);

          // SHADOW
          var shadow = "No prop";

          // RARITY
          var rarity = researchProp(bugsData, "rarity", "Rarity");;
          console.log(rarity);

          // PRICE
          var price = researchProp(bugsData, "price", "Price");;
          console.log(price);

          // IMAGE
          if (researchProp(bugsData, "image", "Image").includes("File:")) {
            var imagename = researchProp(bugsData, "image", "Image").split("|")[0];
            request('https://nookipedia.com/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + imagename, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                console.log(imagename);
                var imageurl = JSON.parse(body)["query"]["pages"];
                var pageid = Object.keys(imageurl)[0];
                imageurl = imageurl[pageid]["imageinfo"][0]["url"];
                console.log(imageurl);
                tweetFishOrBug(name, timeyear, timeday, found, size, shadow, rarity, price, imageurl);
              }
            });
          } else if (researchProp(bugsData, "image", "Image") != "No prop") {
            var imagename = "File: " + researchProp(bugsData, "image", "Image");
            if (imagename != "File: No prop") {
              request('https://nookipedia.com/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + imagename, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  var imageurl = JSON.parse(body)["query"]["pages"];
                  var pageid = Object.keys(imageurl)[0];
                  imageurl = imageurl[pageid]["imageinfo"][0]["url"];
                  console.log(imageurl);
                  tweetFishOrBug(name, timeyear, timeday, found, size, shadow, rarity, price, imageurl);
                }
              });
            }

          } else {
            imageurl = "No image";
            tweetFishOrBug(name, timeyear, timeday, found, size, shadow, rarity, price, imageurl);
          }
        }
      });
    }
  });
}

// MUSIC

function randomMusic() {
  request('https://nookipedia.com/w/api.php?action=query&format=json&list=categorymembers&cmtitle=Category%3A%20Music&cmlimit=500&cmtype=page', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var music = JSON.parse(body)["query"]["categorymembers"];
      music = music.filter(function (value, index, arr) {
        return !(value['title'].includes('User') || value['title'].includes('time'));
      });
      var index = Math.floor(Math.random() * (music.length - 1));
      console.log(music[index]);
      var pageid = music[index]["pageid"];
      request('https://nookipedia.com//w/api.php?action=query&format=json&prop=revisions&rvprop=content&rvsection=0&rvslots=*&pageids=' + pageid, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var musicData = JSON.parse(body)["query"]["pages"][pageid]["revisions"][0]["slots"]["main"]["*"];

          // NAME
          var name = JSON.parse(body)["query"]["pages"][pageid]["title"];
          console.log(name);

          // MOOD
          var mood = researchProp(musicData, "mood", "Mood");
          console.log(mood);

          // INSTRUMENTS
          var instruments = researchProp(musicData, "instruments", "Instruments");
          console.log(instruments);

          // OWNED BY
          var owned = researchProp(musicData, "ownedby", "Ownedby");
          console.log(owned);

          // ORDER
          var order = researchProp(musicData, "order", "Order");
          console.log(order);

          // TIME
          var time = researchProp(musicData, "time", "Time");
          console.log(time);

          // YOUTUBE
          if (musicData.includes("{Youtube|")) {
            var youtube = musicData.split("{Youtube|")[1];
            youtube = youtube.split("}")[0];
            youtube = "https://www.youtube.com/watch?v=" + youtube;
          } else {
            var youtube = "No prop";
          }
          console.log(youtube);

          // IMAGE
          if (researchProp(musicData, "image", "Image").includes("File:")) {
            var imagename = researchProp(musicData, "image", "Image").split("|")[0];
            request('https://nookipedia.com/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + imagename, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                var imageurl = JSON.parse(body)["query"]["pages"];
                var pageid = Object.keys(imageurl)[0];
                imageurl = imageurl[pageid]["imageinfo"][0]["url"];
                console.log(imageurl);
                tweetMusic(name, mood, instruments, owned, order, time, youtube, imageurl);
              }
            });
          } else if (researchProp(musicData, "image", "Image") != "No prop" && researchProp(musicData, "image", "Image") != "") {
            var imagename = "File: " + researchProp(musicData, "image", "Image");
            if (imagename != "File: No prop") {
              request('https://nookipedia.com/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=' + imagename, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                  var imageurl = JSON.parse(body)["query"]["pages"];
                  var pageid = Object.keys(imageurl)[0];
                  imageurl = imageurl[pageid]["imageinfo"][0]["url"];
                  console.log(imageurl);
                  tweetMusic(name, mood, instruments, owned, order, time, youtube, imageurl);
                }
              });
            }

          } else {
            imageurl = "No image";
            console.log(imageurl);
            tweetMusic(name, mood, instruments, owned, order, time, youtube, imageurl);
          }


        }
      });
    }
  });
}

// TWEETS

// CHARACTER

function tweetCharacter(name, gender, species, pers, quote, imageurl) {

  let text = `~ ${days[jour]} : ${category[jour]} ~\n\nName : ${name}`;
  if (gender != "No prop") {
    text = text + `\nGender : ${gender}`;
  }
  if (species != "No prop") {
    text = text + `\nSpecies : ${species}`;
  }
  if (pers != "No prop") {
    text = text + `\nPersonality : ${pers}`;
  }
  if (quote != "No prop") {
    text = text + `\nQuote : ${quote}`;
  }

  if (imageurl != "No image") {
    let filename = imageurl.split("/");
    filename = __dirname + '/images/' + filename[filename.length - 1];
    if (fs.existsSync(filename)) {
      twit.post('media/upload', {
        media: fs.readFileSync(filename)
      }, function (error, media, response) {

        if (!error) {

          let status = {
            status: text,
            media_ids: media.media_id_string
          }

          twit.post('statuses/update', status, function (error, tweet, response) {
            if (!error) {
              console.log(tweet);
            }
          });

        }
      });
    } else {
      download(imageurl, filename, function () {
        twit.post('media/upload', {
          media: fs.readFileSync(filename)
        }, function (error, media, response) {

          if (!error) {

            let status = {
              status: text,
              media_ids: media.media_id_string
            }

            twit.post('statuses/update', status, function (error, tweet, response) {
              if (!error) {
                console.log(tweet);
              }
            });

          }
        });
      });
    }

  } else {
    let status = {
      status: text,
    }
    twit.post('statuses/update', status, function (error, tweet, response) {
      if (!error) {
        console.log(tweet);
      }
    });
  }



}

// FOSSIL

function tweetFossil(name, sciname, sections, period, length, price, imageurl) {

  let text = `~ ${days[jour]} : ${category[jour]} ~\n\nName : ${name}`;
  if (sciname != "No prop") {
    text = text + `\nScientific Name : ${sciname}`;
  }
  if (sections != "No prop") {
    text = text + `\nSections : ${sections}`;
  }
  if (period != "No prop") {
    text = text + `\nPeriod : ${period}`;
  }
  if (length != "No prop") {
    text = text + `\nLength : ${length}`;
  }
  if (price != "No prop") {
    text = text + `\nPrice : ${price}`;
  }

  if (imageurl != "No image") {
    let filename = imageurl.split("/");
    filename = __dirname + '/images/' + filename[filename.length - 1];
    if (fs.existsSync(filename)) {
      twit.post('media/upload', {
        media: fs.readFileSync(filename)
      }, function (error, media, response) {

        if (!error) {

          let status = {
            status: text,
            media_ids: media.media_id_string
          }

          twit.post('statuses/update', status, function (error, tweet, response) {
            if (!error) {
              console.log(tweet);
            }
          });

        }
      });
    } else {
      download(imageurl, filename, function () {
        twit.post('media/upload', {
          media: fs.readFileSync(filename)
        }, function (error, media, response) {

          if (!error) {

            let status = {
              status: text,
              media_ids: media.media_id_string
            }

            twit.post('statuses/update', status, function (error, tweet, response) {
              if (!error) {
                console.log(tweet);
              }
            });

          }
        });
      });
    }

  } else {
    let status = {
      status: text,
    }
    twit.post('statuses/update', status, function (error, tweet, response) {
      if (!error) {
        console.log(tweet);
      }
    });
  }

}

// ARTWORK

function tweetArtwork(name, realname, artist, imageurl) {

  let text = `~ ${days[jour]} : ${category[jour]} ~\n\nName : ${name}`;
  if (realname != "No prop") {
    text = text + `\nReal Name : ${realname}`;
  }
  if (artist != "No prop") {
    text = text + `\nArtist : ${artist}`;
  }

  if (imageurl != "No image") {
    let filename = imageurl.split("/");
    filename = __dirname + '/images/' + filename[filename.length - 1];
    if (fs.existsSync(filename)) {
      twit.post('media/upload', {
        media: fs.readFileSync(filename)
      }, function (error, media, response) {

        if (!error) {

          let status = {
            status: text,
            media_ids: media.media_id_string
          }

          twit.post('statuses/update', status, function (error, tweet, response) {
            if (!error) {
              console.log(tweet);
            }
          });

        }
      });
    } else {
      download(imageurl, filename, function () {
        twit.post('media/upload', {
          media: fs.readFileSync(filename)
        }, function (error, media, response) {

          if (!error) {

            let status = {
              status: text,
              media_ids: media.media_id_string
            }

            twit.post('statuses/update', status, function (error, tweet, response) {
              if (!error) {
                console.log(tweet);
              }
            });

          }
        });
      });
    }

  } else {
    let status = {
      status: text,
    }
    twit.post('statuses/update', status, function (error, tweet, response) {
      if (!error) {
        console.log(tweet);
      }
    });
  }

}

// FISH OR BUG

function tweetFishOrBug(name, timeyear, timeday, found, size, shadow, rarity, price, imageurl) {

  let text = `~ ${days[jour]} : ${category[jour]} ~\n\nName : ${name}`;
  if (timeyear != "No prop") {
    text = text + `\nTime of year : ${timeyear}`;
  }
  if (timeday != "No prop") {
    text = text + `\nTime of day : ${timeday}`;
  }
  if (found != "No prop") {
    text = text + `\nFound : ${found}`;
  }
  if (size != "No prop") {
    text = text + `\nSize : ${size}`;
  }
  if (shadow != "No prop") {
    text = text + `\nShadow : ${shadow}`;
  }
  if (rarity != "No prop") {
    text = text + `\nRarity : ${rarity}`;
  }
  if (price != "No prop") {
    text = text + `\nPrice : ${price}`;
  }

  if (imageurl != "No image") {
    let filename = imageurl.split("/");
    filename = __dirname + '/images/' + filename[filename.length - 1];
    if (fs.existsSync(filename)) {
      twit.post('media/upload', {
        media: fs.readFileSync(filename)
      }, function (error, media, response) {

        if (!error) {

          let status = {
            status: text,
            media_ids: media.media_id_string
          }

          twit.post('statuses/update', status, function (error, tweet, response) {
            if (!error) {
              console.log(tweet);
            }
          });

        }
      });
    } else {
      download(imageurl, filename, function () {
        twit.post('media/upload', {
          media: fs.readFileSync(filename)
        }, function (error, media, response) {

          if (!error) {

            let status = {
              status: text,
              media_ids: media.media_id_string
            }

            twit.post('statuses/update', status, function (error, tweet, response) {
              if (!error) {
                console.log(tweet);
              }
            });

          }
        });
      });
    }

  } else {
    let status = {
      status: text,
    }
    twit.post('statuses/update', status, function (error, tweet, response) {
      if (!error) {
        console.log(tweet);
      }
    });
  }



}

// MUSIC

function tweetMusic(name, mood, instruments, owned, order, time, youtube, imageurl) {

  let text = `~ ${days[jour]} : ${category[jour]} ~\n\nName : ${name}`;
  if (mood != "No prop" && mood != "\n" && mood != "") {
    text = text + `\nMood : ${mood}`;
  }
  if (instruments != "No prop" && instruments != "\n" && instruments != "") {
    text = text + `\nInstruments : ${instruments}`;
  }
  if (owned != "No prop" && owned != "\n" && owned != "") {
    text = text + `\nOwned by : ${owned}`;
  }
  if (order != "No prop" && order != "\n" && order != "") {
    text = text + `\nOrder : ${order}`;
  }
  if (time != "No prop" && time != "\n" && time != "") {
    text = text + `\nTime : ${time}`;
  }
  if (youtube != "No prop") {
    text = text + `\nLink : ${youtube}`;
  }

  if (imageurl != "No image") {
    let filename = imageurl.split("/");
    filename = __dirname + '/images/' + filename[filename.length - 1];
    if (fs.existsSync(filename)) {
      twit.post('media/upload', {
        media: fs.readFileSync(filename)
      }, function (error, media, response) {

        if (!error) {

          let status = {
            status: text,
            media_ids: media.media_id_string
          }

          twit.post('statuses/update', status, function (error, tweet, response) {
            if (!error) {
              console.log(tweet);
            }
          });

        }
      });
    } else {
      download(imageurl, filename, function () {
        twit.post('media/upload', {
          media: fs.readFileSync(filename)
        }, function (error, media, response) {

          if (!error) {

            let status = {
              status: text,
              media_ids: media.media_id_string
            }

            twit.post('statuses/update', status, function (error, tweet, response) {
              if (!error) {
                console.log(tweet);
              }
            });

          }
        });
      });
    }

  } else {
    let status = {
      status: text,
    }
    twit.post('statuses/update', status, function (error, tweet, response) {
      if (!error) {
        console.log(tweet);
      }
    });
  }

}

// DESCRIPTIONS : EVENT OR LOCATION

// SHORT DESCRIPTION

function tweetDesc(text, imageurl) {
  if (imageurl != "No image") {
    let filename = imageurl.split("/");
    filename = __dirname + '/images/' + filename[filename.length - 1];
    if (fs.existsSync(filename)) {
      twit.post('media/upload', {
        media: fs.readFileSync(filename)
      }, function (error, media, response) {

        if (!error) {

          let status = {
            status: text,
            media_ids: media.media_id_string
          }

          twit.post('statuses/update', status, function (error, tweet, response) {
            if (!error) {
              console.log(tweet);
            }
          });

        }
      });
    } else {
      download(imageurl, filename, function () {
        twit.post('media/upload', {
          media: fs.readFileSync(filename)
        }, function (error, media, response) {

          if (!error) {

            let status = {
              status: text,
              media_ids: media.media_id_string
            }

            twit.post('statuses/update', status, function (error, tweet, response) {
              if (!error) {
                console.log(tweet);
              }
            });

          }
        });
      });
    }

  } else {
    let status = {
      status: text,
    }
    twit.post('statuses/update', status, function (error, tweet, response) {
      if (!error) {
        console.log(tweet);
      }
    });
  }
}

// THREAD DESCRIPTION

function tweetDescThread(text, imageurl, eventDescTab) {
  if (imageurl != "No image") {
    let filename = imageurl.split("/");
    filename = __dirname + '/images/' + filename[filename.length - 1];
    if (fs.existsSync(filename)) {
      twit.post('media/upload', {
        media: fs.readFileSync(filename)
      }, function (error, media, response) {

        if (!error) {

          let status = {
            status: text,
            media_ids: media.media_id_string
          }

          twit.post('statuses/update', status, function (error, tweet, response) {
            if (!error) {
              console.log(tweet);
              var id = '' + tweet.id_str;
              var userscreenname = '@' + tweet.user.screen_name;
              asyncLoop(eventDescTab, function (item, next) {
                console.log(id);
                status = {
                  status: userscreenname + '\n' + item,
                  in_reply_to_status_id: id
                }
                twit.post('statuses/update', status, function (error, tweet, response) {
                  if (!error) {
                    console.log(tweet);
                    id = '' + tweet.id_str;
                    next();
                  } else {
                    console.log(error);
                  }
                });
              });
            }
          });

        }
      });
    } else {
      download(imageurl, filename, function () {
        twit.post('media/upload', {
          media: fs.readFileSync(filename)
        }, function (error, media, response) {

          if (!error) {

            let status = {
              status: text,
              media_ids: media.media_id_string
            }

            twit.post('statuses/update', status, function (error, tweet, response) {
              if (!error) {
                console.log(tweet);
                var id = '' + tweet.id_str;
                var userscreenname = '@' + tweet.user.screen_name;
                asyncLoop(eventDescTab, function (item, next) {
                  console.log(id);
                  status = {
                    status: userscreenname + '\n' + item,
                    in_reply_to_status_id: id
                  }
                  twit.post('statuses/update', status, function (error, tweet, response) {
                    if (!error) {
                      console.log(tweet);
                      id = '' + tweet.id_str;
                      next();
                    } else {
                      console.log(error);
                    }
                  });
                });
              }
            });

          }
        });
      });
    }

  } else {
    let status = {
      status: text,
    }
    twit.post('statuses/update', status, function (error, tweet, response) {
      if (!error) {
        console.log(tweet);
        var id = '' + tweet.id_str;
        var userscreenname = '@' + tweet.user.screen_name;
        asyncLoop(eventDescTab, function (item, next) {
          console.log(id);
          status = {
            status: userscreenname + '\n' + item,
            in_reply_to_status_id: id
          }
          twit.post('statuses/update', status, function (error, tweet, response) {
            if (!error) {
              console.log(tweet);
              id = '' + tweet.id_str;
              next();
            } else {
              console.log(error);
            }
          });
        });
      }
    });
  }

}

// BIRTHDAYS

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

// BOT

// INFO

function botInfo() {
  if (jour == 0) {
    randomMusic();
  } else if (jour == 1) {
    randomCharacter();
  } else if (jour == 2) {
    randomEvent();
  } else if (jour == 3) {
    randomFossilArtwork();
  } else if (jour == 4) {
    randomLocation();
  } else if (jour == 5) {
    randomFish();
  } else if (jour == 6) {
    randomBug();
  }
}

// BIRTHDAYS

function botBirthdays() {
  searchBirthday();
}

// RUN

function runBot() {
  // botBirthdays();
  botInfo();
  setTimeout(botInfo,86400000);
  setInterval(botBirthdays,18000000);
  setTimeout(() => {setInterval(botBirthdays,86400000);},18000000);
}

runBot();