const FB = require('fb');
require('dotenv').config();

// You will need to fill in your own access token here
FB.setAccessToken(process.env.FB_ACCESSTOKEN);

const postToFacebook = async (competition) => {
    return new Promise((resolve, reject) => {
      FB.api(
        "me/feed",
        "post",
        { message: competition.title, link: competition.url },
        (res) => {
          if (!res || res.error) {
            console.error(!res ? "error occurred" : res.error);
            reject(res.error);
          } else {
            console.log("Post Id: " + res.id);
            resolve(res.id); // Resolve the promise with the post ID
          }
        }
      );
    });
  };
  
module.exports = postToFacebook;
