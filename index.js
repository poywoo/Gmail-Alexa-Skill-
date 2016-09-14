

var google = require('./node_modules/googleapis');
var OAuth2 = google.auth.OAuth2;

/**
 * Used to decome strings with base64 in javascript (i.e. Email Body)
 * Source: https://scotch.io/tutorials/how-to-encode-and-decode-strings-with-base64-in-javascript
 */
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}};


var CLIENT_ID = undefined; //replace with your client ID
var CLIENT_SECRET = undefined; //replace with client secret
var REDIRECT_URL = undefined; //replace with your redirect URL 

var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
var gmail = google.gmail('v1');

var MAX_NUMBER_MESSAGES = 10; //max number of messages to retrieve 
var UNREAD_MAIL_QUERY = 'is:unread'; //can add query i.e. category:(primary OR promotions)'

var APP_ID = undefined; //replace with "amzn1.echo-sdk-ams.app.[your-unique-value-here]"

/**
 * The AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');

/**
 * GmailReader is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var GmailReader = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
GmailReader.prototype = Object.create(AlexaSkill.prototype);
GmailReader.prototype.constructor = GmailReader;

GmailReader.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("GmailReader onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any initialization logic goes here
};

GmailReader.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("GmailReader onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var speechOutput = "Welcome to GmailReader. You can ask me to check your mailbox or say cancel.";
    var repromptOutput = "You can ask me to check your mailbox or say cancel.";
    response.ask(speechOutput, repromptOutput);
};

GmailReader.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("GmailReader onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);
    // any cleanup logic goes here
};

GmailReader.prototype.intentHandlers = {
    // register custom intent handlers
    "CountMailIntent": function (intent, session, response) {
        if (!session.user.accessToken) { 
            response.tellWithLinkAccount("You must have a G Mail account to use this skill. Please use the Alexa app to link your Amazon account with your G Mail Account.");
        } else {
            getNumberMail(intent, session, response);
        };
    },
    "DontListMessageIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },
    "ListMessageIntent": function (intent, session, response) {
        var sessionAttributes = session.attributes;
        if (sessionAttributes.messagesIndex < sessionAttributes.numberMessagesReturned) {
            var ID = sessionAttributes.gmailMessageIDList[sessionAttributes.messagesIndex];
            sessionAttributes.messagesIndex += 1;
            getMessageFields(intent, session, response, ID);    
        } else {
            var speechOutput = "There are no more unread messages to list. Goodbye."; //make call to list next message
            response.tell(speechOutput);
        };      
    },
    "DontReadIntent": function (intent, session, response) {
        var sessionAttributes = session.attributes;
        if (sessionAttributes.messagesIndex < sessionAttributes.numberMessagesReturned) {
            var ID = sessionAttributes.gmailMessageIDList[sessionAttributes.messagesIndex];
            sessionAttributes.messagesIndex += 1;
            getMessageFields(intent, session, response, ID);    
        } else {
            var speechOutput = "There are no more unread messages to list. Goodbye."; //make call to list next message
            response.tell(speechOutput);
        };      
    },
    "ReadIntent": function (intent, session, response) {
        var sessionAttributes = session.attributes;
        var ID = sessionAttributes.gmailMessageIDList[sessionAttributes.messagesIndex-1];
        
        // mark the email as read in the mailbox
        markAsRead(ID);

        //reponse
        var speechOutput = sessionAttributes.messageDictionary[ID] + " End of message. Do you want to list the next message?"
        var repromptOutput = 'Do you want to list the next message? Please say yes or no';
        response.ask(speechOutput, repromptOutput);
    },
    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },
    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    }
};

/**
 * Gets the Alexa response for the number of messages in mailbox for the user.
 */
function getNumberMail(intent, session, AlexaResponse) {
    var speechOutput = "This is a mistake.";
    var repromptOutput = "Please say yes or no to list messages, or cancel.";
    //set sessionAttributes
    var sessionAttributes = {};
    sessionAttributes.messagesIndex = 0;
    sessionAttributes.messageDictionary = {};
    sessionAttributes.gmailMessageIDList = []; 
    sessionAttributes.numberMessagesReturned = 0;
    // set access token
    oauth2Client.setCredentials({access_token: session.user.accessToken });

    gmail.users.messages.list({ 
        auth: oauth2Client,
        userId: 'me',  
        maxResults: MAX_NUMBER_MESSAGES, 
        q: UNREAD_MAIL_QUERY
    }, function (err, response) {
        if (err) {
            console.log('The GMail API returned an error: ' + err);
            speechOutput = 'GMail returned an error while getting your mail. Please try again later.';
            AlexaResponse.tell(speechOutput);
        } else {
            if (response.messages != undefined) {
                sessionAttributes.numberMessagesReturned = response.messages.length;
                response.messages.forEach(function(value) {
                  //value.id is the message ID 
                    sessionAttributes.gmailMessageIDList.push(value.id);
                });
            } else {
                sessionAttributes.numberMessagesReturned = 0;
            }
            speechOutput = ' You have ' + sessionAttributes.numberMessagesReturned + ' unread ' +  (sessionAttributes.numberMessagesReturned === 1 ? (' message ') : ' messages ') + ' in your account.' + 
                            (sessionAttributes.numberMessagesReturned === 0 ? (' Please say cancel.') : ' Do you want me to list them?');
            AlexaResponse.ask(speechOutput, repromptOutput);
        };
    });
    session.attributes = sessionAttributes;
};


/**
 * Marks the email from ReadIntent as read in the user's inbox.
 */
function markAsRead(messageID) {
  var gmail = google.gmail({ auth: oauth2Client, version: 'v1' });
  gmail.users.messages.modify({
    userId: 'me',
    id: messageID,
    resource:
      {
        "removeLabelIds": ["UNREAD"]
      }
  }, function (err,response) {
    if (err) {
    console.log("markAsRead returned an error: " + err);
    } else {
      console.log("Message marked as read: " + messageID);
    };
  });
}

/**
 * Gets the Alexa response for the sender, date, and time for each message. Then asks user if he wants to read the email.
 */
function getMessageFields(intent, session, AlexaResponse, messageID) {
    var sessionAttributes = session.attributes;
    var speechOutput = 'Getting message fields';
    var repromptOutput = "Please say read or next."
    var gmail = google.gmail({ auth: oauth2Client, version: 'v1' });
    gmail.users.messages.get({
        userId: 'me',
        id: messageID 
    }, function (err,response) {
        if (err) {
            speechOutput = 'GMail returned an error while getting your mail. Please try again later.';
            AlexaResponse.tell(speechOutput);
            console.log('The GMail API returned an error: ' + err);
        } else {
            //put the message into sessionAttributes.messageDictionary in case of ReadIntent 
            var bodyText = response.payload.parts;
            bodyText = bodyText.filter(function(item) {
              return (item.mimeType == 'text/plain');
            });
            bodyText = bodyText[0]["body"]["data"];
            bodyText = Base64.decode(bodyText);
            
            sessionAttributes.messageDictionary[messageID] = bodyText;

            //sets up Alexa response
            var payload = response.payload;
            payload = payload.headers.filter(function(item) {
              return (item.name == 'From' || item.name == 'Date' || item.name == 'Subject')
            });
            var sender = '';
            var date = '';
            var subject = '';
            payload.forEach(function(item) {
              if (item.name == 'From') {
                sender = item.value;
                //split into Name and Email
                sender = sender.split("<")[0];
              }
              if (item.name == 'Date') {
                date = item.value;
                var temp = date.split(" ");
                date = getFullDay(temp[0]) + " " + getFullMonth(temp[2]) + " " + temp[1] + ' at ' + getFullTime(temp[4]);
              }
              if (item.name == 'Subject') {
                subject = item.value;
              }
            });
            speechOutput = 'Message from ' + sender + ' received on ' + date + ' with subject ' + subject;
            AlexaResponse.ask(speechOutput, repromptOutput);
            //console.log('getMessageFields speech output: ' + speechOutput);
        }
    });
}

/**
 * Returns the full name of the day from gmail date format (i.e. Fri, 1 Jul 2016 02:44:16 -0700)
 */
function getFullDay(day) {
  var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  days = days.filter(function(item) {
    return item.startsWith(day.slice(0,2));
  });
  return days[0];
}

/**
 * Returns the full name of the month from gmail date format
 */
function getFullMonth(month) {
  var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  months = months.filter(function(item) {
    return item.startsWith(month);
  });
  return months[0];
}

/**
 * Returns the time from from gmail date format
 */
function getFullTime(time) {
  var temp = time.split(":");
  temp = temp.map(function(item) {
    return parseInt(item, 10);
  });
  var hour = temp[0];
  var minutes = temp[1];
  var m = "A M";
  if (hour == 0) {
    hour = 12;
  } else if (hour < 12) {
  } else if (hour > 12) {
    hour = hour-12;
    m = "P M";
  } else {
    m = "P M"
  };
  return hour + (minutes=== 0 ? (' ') : ':'+ minutes+ ' ') + m;
}


// Create the handler that responds to the Alexa Request. 
exports.handler = function (event, context) {
    // Create an instance of the GmailReader skill.
    var reader = new GmailReader();
    reader.execute(event, context);
};
