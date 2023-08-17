// import crypto from "crypto-js";
// import oauth1a from "oauth-1.0a";
// import { GARMIN_CONSUMER_KEY, GARMIN_CONSUMER_SECRET } from "../constants";
const crypto = require("crypto-js");
const oauth1a = require("oauth-1.0a");

const GARMIN_CONSUMER_KEY = process.env.GARMIN_CONSUMER_KEY;
const GARMIN_CONSUMER_SECRET = process.env.GARMIN_CONSUMER_SECRET;

// export class Oauth1Helper {
//   static getAuthHeaderForRequest(request, token, verifier) {
//     const oauth = oauth1a({
//       consumer: {
//         key: GARMIN_CONSUMER_KEY,
//         secret: GARMIN_CONSUMER_SECRET,
//       },
//       signature_method: "HMAC-SHA1",
//       hash_function(base_string, key) {
//         return crypto.algo.HMAC.create(crypto.algo.SHA1, key)
//           .update(base_string)
//           .finalize()
//           .toString(crypto.enc.Base64);
//       },
//     });

//     const authorization = oauth.authorize(request, token, verifier);

//     return oauth.toHeader(authorization);
//   }
// }

module.exports = {
  getAuthHeaderForRequest: (request, token, verifier) => {
    const oauth = oauth1a({
      consumer: {
        key: GARMIN_CONSUMER_KEY,
        secret: GARMIN_CONSUMER_SECRET,
      },
      signature_method: "HMAC-SHA1",
      hash_function(base_string, key) {
        return crypto.algo.HMAC.create(crypto.algo.SHA1, key)
          .update(base_string)
          .finalize()
          .toString(crypto.enc.Base64);
      },
    });

    const authorization = oauth.authorize(request, token, verifier);

    return oauth.toHeader(authorization);
  },
};
