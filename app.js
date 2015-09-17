console.log('\033[2J');
var creds = require('./creds');
const DEV_MODE = true;

//MYSQL STUFF
var mysql = require('mysql');
var pool  = mysql.createPool({
    connectionLimit : 10,
    host            : 'localhost',
    database        : 'TwitMonLee',
    user            : creds.mysql.user,
    password        : creds.mysql.password
});

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
    };
var user = users.Radio1045;

//listens for tweets from a user
/*
console.log('looking for tweets from: @' + user.name);
client.stream('statuses/filter', {follow: user.id}, function(stream) {
    stream.on('data', function(tweet) {
        //check if they tweeted something
        if(tweet.text) {
            //log it, as long as its not a RT
            if(tweet.text.substring(0, 4) !== "RT @") {
                //now, lets only care if its a tweet FROM this user, not just mentioning them
                if(tweet.user.id === user.id) {
                    console.log(tweet.text);
                    pushOver(tweet.text, 'New tweet from @' + user.name);
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
*/
//listenes for all tweets with keywords
var keywords = [
    'follow retweet win',
    'follow retweet contest',
    'follow rt win',
    'follow rt contest',
    'follow retweet giveaway',
    'follow rt giveaway',
    'rt contest',
    'rt win',
    'retweet win',
    'retweet contest',
    'retweet giveaway'
    ],
    keywordsCSV = keywords.join();

console.log('looking for tweets with: ' + keywordsCSV);
console.log('------------------------------');

client.stream('statuses/filter', {track: keywordsCSV}, function(stream) {
    stream.on('data', function(tweet) {
        //check if they tweeted something
        if(tweet.text) {
            //log it, as long as its not a RT or @
            if(!tweet.quoted_status_id &&
               tweet.text.substring(0, 4) !== "RT @" && 
               tweet.text.substring(0, 1) !== "@" && 
               tweet.text.substring(0, 3) !== 'RT ' && 
               tweet.text.substring(0, 4) !== 'RT: ' && 
               tweet.text.substring(0, 2) !== '"@' && 
               tweet.text.substring(0, 4) !== '#RT ' && 
               tweet.text.substring(0, 5) !== '#RT: ' && 
               tweet.text.toLowerCase().indexOf('vote') < 0 &&
               tweet.text.toLowerCase().indexOf('voto') < 0 &&
               tweet.text.toLowerCase().indexOf('stop by') < 0 &&
               tweet.text.toLowerCase().indexOf('click here') < 0 &&
               tweet.text.toLowerCase().indexOf('I\'ve entered') < 0
            ) {
                //now make sure the actual text contains a phrase. twitter returns a lot of bs. card text matches the filter which we dont want
                var excludeRegex = /.+( ?)(: RT(:?))/ig; 
                var match = tweet.text.match(excludeRegex);
                if(!match) {
                    //console.log(tweet);
                    console.log('@' + tweet.user.screen_name + ': ' + tweet.text);
                    console.log('------------------------------');
                    //wait anywhere from half a second to 1mins to enter
                    var delay = Math.floor((Math.random() * 1) + 300);
                    delay = delay * 1000;
                    setTimeout(function() {
                        enterContest(tweet);
                    }, delay);
                }
            }
        }
    });

    stream.on('error', function(error) {
        console.log(error);
        throw error;
    });
});

//twitter helper methods
function sendTweet() {
    'use strict';
    
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

function retweet(id) {
    'use strict';
    client.post('statuses/retweet', {id: id, trim_user: true},  function(error, tweet, response){
        if(error) {
            console.log(error);
            console.log(id);
            //throw error;
        }
        else {
           // console.log('Retweeted');
        }
    });
}

function favorite(id) {
    'use strict';
    client.post('favorites/create', {id: id, trim_user: true},  function(error, tweet, response){
        if(error) {
            console.log(error);
            console.log(id);
            //throw error;
        }
        else {
            //console.log('Faved');
        }
    });
}
function follow(id) {
    'use strict';
    client.post('friendships/create', {user_id: id},  function(error, tweet, response){
        if(error) {
            console.log(error);
            console.log(id);
            //throw error;
        }
        else {
           // console.log('Followed');
        }
    });
}
function checkIfDeleted(tweet) {
    'use strict';
    client.get('statuses/show', {id: tweet.id_str, trim_user: true, include_entities: false},  function(error, tw, response){
        if(error) {
            console.log(error);
            console.log('deleted as fuck');
        }
        else {
            console.log('Not deleted! Lets enter this contest...');
            //enterContest(tweet);
        }
    });
}

//send a push notification to pushover
function pushOver(text, title) {
    'use strict';
    var Pushover = require('node-pushover');
    var push = new Pushover({
        token: creds.pushOver.token,
        user: creds.pushOver.user
    });
    if(!title) {
        title = 'TwitMonLee';
    }
    if(!text) {
        text = 'New push notification!';
    }

    // A callback function is defined:
    push.send(title, text, function (err, res){
        if(err) {
            console.log("Error sending push");
            console.log(err);
            console.log(err.stack);
        }
        else {
            //console.log("DEV: Push notification sent successfully.");
            console.log(res);
        }
    });
}

//this function handles entering the actual contest. just be on the safe side we will rt, fav, and follow everything
function enterContest(tweet) {
    'use strict';
    //first thing is first, dont do anything if its a contest we already entered. for now we will assume 1 userid = 1 contest
    hasEntered(tweet)
}

//checks the db to see if a contest from the selected user has alread ybeen entered
function hasEntered(tweet) {
    'use strict';
    var query = pool.query('SELECT userID FROM Contests WHERE userID = ' + tweet.user.id, function(err, rows, fields) {
        if(err) {
            console.log(err);
            throw err;
        }
        if(!rows) {
            console.log('ALREADY ENTERED A CONTEST FROM THIS USER');
            return false;
        }
        else {
            //add contest deets to the db
            addToDB(tweet);
            //rt and fav. delay a bit between both
            retweet(tweet.id_str);
            favorite(tweet.id_str);
            follow(tweet.user.id);
            updateDB(tweet, true, true, true);
            console.log('!!CONTEST ENTERED!!');
        }
    });
}
function addToDB(tweet) {
    'use strict';
    var sql = 'INSERT INTO Contests SET userName=?, userID=?, entered=?, retweeted=?, faved=?, following=?, text=?';
    var inserts = [
        tweet.user.screen_name,
        tweet.user.id,
        0,
        0,
        0,
        0,
        tweet.text
    ];
    sql = mysql.format(sql, inserts);
    pool.query(sql, function(err, rows, fields) {
        if(err) {
            console.log(err);
            throw err;
            return false;
        }
        else {
            return true;
        }
    });
}

function updateDB(tweet, rt, fav, follow) {
    'use strict';
    var sql = 'UPDATE Contests SET entered=?, retweeted=?, faved=?, following=? WHERE userID=?';
    var inserts = [
        true,
        rt,
        fav,
        follow,
        tweet.user.id
    ];
    sql = mysql.format(sql, inserts);
    pool.query(sql, function(err, rows, fields) {
        if(err) {
            console.log(err);
            throw err;
            return false;
        }
        else {
            return true;
        }
    });
    
    return true;
}





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