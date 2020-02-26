import environ from os;

module.exports = {
    consumer_key: environ['CONSUMER_KEY'],
    consumer_secret: environ['CONSUMER_SECRET'],
    access_token_key: environ['ACCESS_TOKEN_KEY'],
    access_token_secret: environ['ACCESS_TOKEN_SECRET']
  }