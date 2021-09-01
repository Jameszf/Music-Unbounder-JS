
const fs = require("fs")
const readline = require("readline")
const { google } = require("googleapis")


// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
// The file token.json stores the user"s access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

const TOKEN_PATH = "token.json"
const CRED_PATH = "credentials.json"


/*
// Load client secrets from a local file.
fs.readFile(CRED_PATH, (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content), listLabels);
});
*/

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */


function readCredentials() {
    return new Promise((resolve, reject) => {
        fs.readFile(CRED_PATH, (err, content) => {
          if (err) reject(`Error loading client secret file: ${err}`);
          resolve(JSON.parse(content))
        });
    })
}


function authorize() {
    return new Promise((resolve, reject) => {
        readCredentials()
            .then(creds => {
                const {client_secret, client_id, redirect_uris} = creds.installed;
                const service = new google.auth.OAuth2(
                    client_id, client_secret, redirect_uris[0]);

                fs.readFile(TOKEN_PATH, (err, token) => {
                    if (err) {
                        getNewToken(service)
                            .then(res => resolve(res))  
                            .catch(err => reject(err))
                    } else {
                        service.setCredentials(JSON.parse(token))
                        resolve(service)
                    }
                });
            }).catch(err => reject(err))
    })
}


/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(service) {
    return new Promise((resolve, reject) => {
        const authUrl = service.generateAuthUrl({
            access_type: "offline",
            scope: SCOPES,
        });
        console.log("Authorize this app by visiting this url:", authUrl);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question("Enter the code from that page here: ", (code) => {
            rl.close()
            service.getToken(code, (err, token) => {
                if (err) reject(`Error retrieving access token ${err}`);
                service.setCredentials(token)
                // Store the token to disk for later program executions
                fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                    if (err) reject(err)
                    console.log("Token stored to", TOKEN_PATH)
                });
                resolve(service)
            });
        })
    })
}



function isOperational(service) {
    return new Promise((resolve, reject) => {
        try { 
            service.users.labels.list({ userId: "me" })
            resolve(true)
        } catch (error) {
            console.log("ERROR!")
            console.log(error)
            resolve(false)
        }
    })
}


/*
export default {
    use(callback) {
        if (service != undefined) {

        }
    }
}
*/

/*
async function listLabels() {
    const auth = await authorize()
    const gmail = google.gmail({version: 'v1', auth});
    gmail.users.labels.list({
        userId: 'me',
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const labels = res.data.labels;
        if (labels.length) {
            console.log('Labels:');
            labels.forEach((label) => {
                console.log(`- ${label.name}`);
            });
        } else {
            console.log('No labels found.');
        }
    });
}

listLabels()
*/

let service = undefined
module.exports = {
    getService: function() {
        return new Promise(async (resolve, reject) => {
            if (service == undefined) {
                const auth = await authorize()
                service = google.gmail({version: "v1", auth: auth})
            }

            resolve(service)
        })
    },
    isOperational
}




