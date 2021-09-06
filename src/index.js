
const firebase = require("firebase-admin")
const { MessageEmbed, Client, 
        Collection, Intents,
        MessageActionRow,
        MessageButton } = require("discord.js")
const dotenv = require("dotenv")
const { SlashCommandBuilder, inlineCode } = require("@discordjs/builders")
const { REST } = require("@discordjs/rest")
const { Routes } = require('discord-api-types/v9')
const schedule = require("node-schedule")
const fs = require("fs")

const gmail = require("./gmail.js")
const { Registered, Student, Email, Job } = require("./classes.js")
const db = require("./firestore.js")


dotenv.config()

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })
client.commands = new Collection()



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



async function alertChannel(reg) {
    const customId = reg["ID"] == undefined ? "UNKNOWN" : reg["ID"]
    const cid = "853027444432306237"
    const gid = "810643050555637782"
    const guild = client.guilds.cache.get(gid)
    const channel = guild.channels.cache.get(cid)
    
    const newStud = new MessageEmbed()
            .setColor("#f7f7f7")
            .setTitle("Someone just registered!")
            .addFields(reg.getEmbedFields())

    const buttons = [new MessageButton()
            .setCustomId(customId)
            .setLabel("Accept as my Student")
            .setStyle("PRIMARY")]
    const row = new MessageActionRow()
            .addComponents(buttons)
    
    await channel.send({embeds: [newStud], components: [row]})
}



function checkGmail() {
    gmail.getService().then(async service => {
        const res = await service.users.messages.list({
            q: `in:inbox is:unread`,
            userId: 'me',
        });
    
        if (res.status == 200) {
            if (res.data.resultSizeEstimate > 0) {
                const emails = await parseEmails(res.data.messages)
                const regs = emails.map(x => x.toRegistered())
                console.log("Registered", regs)
                regs.forEach(async reg => {
                    console.log(reg)

                    const exists = await db.regExists(reg)
                    if (true) {
                        //const newDoc = db.addRegistered(reg)
                        console.log(`Added ${reg.Name} as a new Registered.`)
                        alertChannel(reg)
                    } else {
                        console.log(reg.Name, "is already in the system!")
                    }
                })
            } else {
                console.log(`No unread messages.`)
            }
        } else {
            console.error(res)
        }
    })
}



function executeJob(type, data) {
    console.log(`Executing ${type} job at ${Date.now()} with ${data}`)
}



async function initJobs() {
    const jobs = await db.getAllJobs()
    jobs.forEach(job => {
        const time = new Date()
        time.setTime(job["Time"])

        schedule.scheduleJob(time, () => executeJob(job["Type"], job["Data"]))
    })

    /* 
    // TODO Enable for production
    const rule = new schedule.RecurrenceRule()
    rule.minute = [new schedule.Range(0, 60, 2)]
    
    schedule.scheduleJob(rule, () => {
        checkGmail();
    })
    */

    console.log("Initialized all jobs.")
}



async function registCmds() {
    const rest = new REST({ version: "9" }).setToken(process.env.BOT_TOKEN)
    const commandFiles = fs.readdirSync("./src/commands").filter(file => file.endsWith(".js"))
    const commands = []
    
    for (const file of commandFiles) {
        const command = require(`./commands/${file}`)
        client.commands.set(command.data.name, command)
        commands.push(command.data.toJSON())
    } 
    try {
        await rest.put(
            Routes.applicationGuildCommands(
                process.env.BOT_CLIENT_ID, 
                process.env.GUILD_ID),
            { body: commands });

        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error(error);
    }
}



client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            console.log(command)
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    } else if (interaction.isButton()) {
        const customId = interaction.customId
        
        if (customId === "UNKNOWN") {
            await interaction.reply({
                    content: "Whoops! An error occured, this button will now self-destruct",
                    ephemeral: true
                })
            setTimeout(() => {
                interaction.message.delete()
            }, 5000)
            console.log("Registered alert did not have a valid ID")
        } else {
            console.log(`Someone wants to claim Registered#${customId}`) 
            const userId = interaction.user.id
            db.getTeachersById(userId).then(async docs => {
                if (docs.length == 1) {
                    if (await db.exists("Registered", customId)) {
                        const newStud = new Student("", "", "", "", customId, userId)
                        db.addStudent(newStud)
                    } else {
                        interaction.reply({
                            content: `Cannot find the registered person in the database. Cancelling Student takein.`)
                        })
                    }
                } else if (docs.length > 1) {
                    console.log(`Discord ID ${userId} has multiple Teacher docs.`)
                    await interaction.reply({
                        content: `Something seems to be wrong with the system at the moment.\n
                                    Please try again later!`,
                        ephemeral: true
                    })
                } else {
                    const suggest = inelineCode("/teacher register")
                    await interaction.reply({
                        content: `Sorry it seems we don't have you in the system as a Teacher!\n
                                    Please use the ${suggest} command to register yourself.`,
                        ephemeral: true
                    })
                }
            })
        }
    }   
    /*else if (interaction.isSelectMenu()) {
        
    }*/
})



client.once("ready", () => {
    console.log("Ready!")
    registCmds()
    initJobs()
    checkGmail()
});



client.login(process.env.BOT_TOKEN)


