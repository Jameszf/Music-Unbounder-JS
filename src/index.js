
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






async function alertChannel(reg) {
    const customId = reg["ID"] == undefined ? "UNKNOWN" : reg["ID"]
    const cid = "853027444432306237"
    const gid = "810643050555637782"
    const guild = client.guilds.cache.get(gid)
    const channel = guild.channels.cache.get(cid)
    
    const embed = reg.toEmbed()
            .setColor("#f7f7f7")
            .setTitle("Someone just registered!")

    const buttons = [new MessageButton()
            .setCustomId(customId)
            .setLabel("Accept as my Student")
            .setStyle("PRIMARY")]
    const row = new MessageActionRow()
            .addComponents(buttons)
    
    await channel.send({embeds: [embed], components: [row]})
}



// Does not check if job was already completed.
function executeJob(job) {
    console.log(`Executing ${job["Type"]} job at ${Date.now()} with ${job["Data"]}`)
    switch (job["Type"]) {
        case "EMAIL":
            // TODO
            break
        case "DISCORD_MESSAGE":
            // TODO 
            break
        default:
            
    }
}



function onNewStudent() {
    const newDoc = db.addToFirestore(reg)
    console.log(`Added ${reg.Name} as a new Registered.`)
    alertChannel(reg)
}


function processGmail() {
    gmail.checkGmail().then(async emailIds => {
        const emails = await gmail.parseEmails(emailIds)
        const regs = emails.map(x => x.toRegistered())
        console.log("Registered", regs)
        regs.forEach(async reg => {
            console.log(reg)

            const exists = await db.exists("Registered", reg)
            if (!exists) {
                onNewStudent(reg)
            } else {
                console.log(reg.Name, "is already in the system!")
            }
        })
    }).catch(err => console.log("Could not check emails because: ", err))
}



async function initJobs() {
    /*
    const jobs = await db.getAllDocs("Jobs")
    jobs.forEach(job => {
        if (job.todo()) {
            const time = new Date()
            time.setTime(job["Time"])

            schedule.scheduleJob(time, () => executeJob(job))
        }
    })
    */

    const rule = new schedule.RecurrenceRule()
    rule.minute = [new schedule.Range(0, 60, 2)]
    
    schedule.scheduleJob(rule, () => {
        processGmail()
    })

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



async function onCommand(interaction) {
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        console.log(command)
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
}



async function onButton(interaction) {
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
                const req = await db.getDocById("Registered", customId)
                if (req.exists) {
                    const registered = Registered.fromObj(req.data())
                    const newStud = new Student("", "", "", "", customId, userId)
                    db.addStudent(newStud)
                    await client.users.cache.get(userId).send({
                        content: "You've successfully accepted a new Student! Here is their information:",
                        embeds: [
                            registered.toEmbed(false)
                        ]
                    })
                    /* send email to student alerting them they've been accepted */
                } else {
                    interaction.reply({
                        content: `Cannot find the registered person in the database. Cancelling Student takein.`
                    })
                }
            } else {
                const suggest = inelineCode("/teacher register")
                await interaction.reply({
                    content: `Sorry we couldn not find you in the system.\n
                                Please contact @Jamess#9113 to resolve this issue.`,
                    ephemeral: true
                })
            }
        })
    }
}



async function onMenu(interaction) {
    console.log("Menu used.")
}



client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        await onCommand(interaction)
    } else if (interaction.isButton()) {
        await onButton(interaction)
    } else if (interaction.isSelectMenu()) {
        await onMenu(interaction)
    }
})



client.once("ready", () => {
    console.log("Ready!")
    //registCmds()
    initJobs()
    
    // FOR DEVELOPMENT
    // processGmail()
});



client.login(process.env.BOT_TOKEN)


