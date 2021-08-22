
import cron from "node-cron"
import firebase from "firebase-admin"
import { Client, Intents } from "discord.js"
import { readFile } from "fs/promises"

import gmail from "./gmail.js"

const SACC_PATH = "serviceAccount.json"

const serviceAccount = await readFile(SACC_PATH)
                                .then(contents => JSON.parse(contents))


const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount)
})
        
const db = firebase.firestore()



class Registered {
    constructor(ID, Name, Guardian, Instrument, 
                Platform, Email, Phone, Prefers, 
                From, Statement, join_on, ref_ID) {
        this.ID = ID
        this.Name = Name
        this.Guardian = Guardian
        this.Instrument = Instrument
        this.Platform = Platform
        this.Email = Email
        this.Phone = Phone
        this.Prefers
    }
}


class Email {
    constructor(subject, body) {
        this.subject = subject
        this.body = body
    }

    toRegistered() {
        const vals = this.body.split("<br><br>")
        vals.pop()
        console.log(vals)

        const obj = {}
        const re = /\<strong\>([\w|\s]+)\<\/strong\>\:\s(.+)/g
        for (let item of vals) {
            const res = item.match(re)
            if (res == null) {
                console.log(item, "is causing a null!")
            } else {
                obj[res[0]] = res[1]
            }
        }
    
        console.log("Finished!")
        console.log(obj)
    }
}



function parseEmails(emailIds) {
    return new Promise((resolve, reject) => {
        gmail.getService().then(async service => {
            const filtered = []
            for (let id of emailIds) {
                const res = await service.users.messages.get({
                    "userId": "me",
                    "id": id.id,
                })

                if (res.status == 200) {
                    for (let header of res.data.payload.headers) {
                        if (header.name == "Subject" && header.value == "Automatic Student Registration") {
                            const buff = Buffer.from(res.data.payload.body.data, "base64")
                            const body = buff.toString("utf-8")
                            const subject = header.value
                            filtered.push(new Email(subject, body))
                            break
                        }
                    }
                } else {
                    console.error(res)
                }
            }
            resolve(filtered)
        }).catch(err => reject(err))
    })
}


function checkGmail() {
    gmail.getService().then(async service => {
        const res = await service.users.messages.list({
            q: `in:inbox is:read`,
            userId: 'me',
        });
    
        if (res.status == 200) {
            if (res.data.resultSizeEstimate > 0) {
                const emails = await parseEmails(res.data.messages)
                console.log(emails[0].toRegistered())
            } else {
                console.log(`No unread messages.`)
            }
        } else {
            console.error(res)
        }
    })
}


client.once("ready", () => {
    console.log("Ready!")

    const task = cron.schedule("*/2 * * * * *", () => {
        console.log("CRON JOB")
        checkGmail();
    })
    console.log("CRONs initialized")
    task.start()
});

client.login("ODUzMDE3Mzk4MTYzOTMxMTQ2.YMPQXA.4w7jFGOsfHT-dZ4FrtF9FOz46Wo")

