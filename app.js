var creds = require('./creds');
const DEV_MODE = true;
/*var express = require('express');
var app = express();

app.get('/', function (req, res) {
    res.send('Hello World!');
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});*/

// ----- for dev: space bar = dash press --------- //
if(DEV_MODE === true) {
    var keypress = require('keypress');
    // make `process.stdin` begin emitting "keypress" events
    keypress(process.stdin);
    // listen for the "keypress" event
    process.stdin.on('keypress', function (ch, key) {
        'use strict';
        if(key && key.ctrl && key.name === 'c') {
            process.exit();
         }
         else if(key && key.name === 'space') {
             sendTweet();
         }
    });

    process.stdin.setRawMode(true);
    //process.stdin.resume();
}

//init twitter
var Twitter = require('twitter');
var client = new Twitter({
    consumer_key: creds.twitter.consumerKey,
    consumer_secret: creds.twitter.consumerSecret,
    access_token_key: creds.twitter.accessToken,
    access_token_secret: creds.twitter.accessSecret
});
//stream all tweets matching 'track' var
var phrase = '#masterchef',
    users = {
        FunkeDope: {
            name: 'FunkeDope',
            id: 21332344
        },
        Radio1045: {
            name: 'Radio1045',
            id: 21720480
        }
    }
var user = users.Radio1045;

console.log('looking for tweets from: ' + user.name);
client.stream('statuses/filter', {follow: user.id}, function(stream) {
    stream.on('data', function(tweet) {
        //check if they tweeted something
        if(tweet.text) {
            //log it, as long as its not a RT
            if(tweet.text.substring(0, 4) !== "RT @") {
                //now, lets only care if its a tweet FROM this user, not just mentioning them
                if(tweet.user.id === user.id) {
                    console.log(tweet.text);
                    console.log('------------------------------');
                }
            }
        }
    });

    stream.on('error', function(error) {
        console.log(error);
        throw error;
    });
});


function sendTweet() {
    'use strict';

    //get all tweets by user
    /*var params = {screen_name: 'FunkeDope'};
    client.get('statuses/user_timeline', params, function(error, tweets, response) {
        if(!error) {
            console.log(tweets);
        }
    });*/

    //tweet something
    var status = 'I want Pizza! #AMAZONDASH';
    client.post('statuses/update', {status: status},  function(error, tweet, response){
        if(error) {
            console.log(error);
            throw error;
        }
        else {
            //console.log(tweet);  // Tweet body.
            console.log('Tweet sent: "' + status + '"');
        }
    });
}
