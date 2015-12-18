var SteamCommunity = require('steamcommunity');
var community = new SteamCommunity();
var Request = require('request');
var SteamTotp = require('steam-totp');
var Q = require('q');
var config = require('nconf');

config
  .argv()
  .env();

var Confirmator = {
  sessionID: null,
  cookies: null,
  steamguard: null,
  details: null,
  setUp: function() {
      return Q.Promise(function(resolve, reject) {
        if(!config.get('account') || !config.get('pass') || !config.get('shared') || !config.get('identity')) {
          reject('Usage: node app.js --account="Account Name" --pass="Account password" --shared="Shared secret=" --identity="Identity secret"');
          return;
        }
        Confirmator.details =  {
          "sharedSecret" : config.get('shared'),
          "identitySecret" :  config.get('identity'),
          "accountName": config.get('account'),
          "password": config.get('pass'),
          "twoFactorCode": SteamTotp.generateAuthCode(config.get('shared'))
        }
	      console.log("Account name : " + config.get('account'));
        console.log("Password : " + config.get('pass'));
        console.log("Shared secret : " + config.get('shared'));
        console.log("Identity : " + config.get('identity'));
        resolve('Y');
      });
  },
  login: function() {
      return Q.Promise(function(resolve, reject) {
        community.login(Confirmator.details, function(err, sid, ck, sg) {
            resolve({sessionId: sid, cookies: ck, steamguard: sg});
        });
      });
  },
  getConfirmations: function(userObj) {
    return Q.Promise(function(resolve, reject) {
        var timekey=Math.round(Date.now() / 1000);
        var confirmationkey = SteamTotp.getConfirmationKey(Confirmator.details.identitySecret, timekey, "conf");
        community.startConfirmationChecker(10000, Confirmator.details.identitySecret);
    });
  }
};

Confirmator.setUp()
  .then(Confirmator.login)
  .then(Confirmator.getConfirmations)
  .fail(function(reason) {
      console.log(reason);
  })
  ;
