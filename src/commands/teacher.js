
const { MessageEmbed, MessageActionRow, MessageSelectMenu } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders")
const db = require("../firestore.js")



function makeTeacherFields(doc) {
    order = [
        "Name", "Discord_ID", "Instruments", "Email", "Phone", "Status", 
    ]
    mapping = {
        "Discord_ID": "Discord ID",
    }
    isInline = new Set(["Name", "Discord_ID", "Email", "Phone"])
    
    const fields = []
    for (let field of order) {
        const inline = isInline.has(field) 
        let key = field, value = doc[field]
        if (mapping[field] != undefined) key = mapping[field]
        fields.push({ name: key, value, inline })
    }
    return fields
}



async function getUserInput(interaction, prom) {
    console.log("Recieved interaction:")
    console.log(interaction)
    await interaction.reply({ content: prom })
    
    return new Promise((resolve, reject) => {
        let good = false
        const filter = m => m
        const collector = interaction.channel.createMessageCollector({ filter, time: 30000 })
        
        collector.on("collect", m => {
            console.log(m)
            good = true
            collector.stop()
            resolve(m.content)
        })

        collector.on("end", async m => {
            if (!good) {
                reject("Collector did not recieve input.")
            }
        })
    })
}



async function getInput(thread, prompts, res, finished) {
    if (prompts.length === 0) return finished(thread, res)

    await thread.send(prompts[0])
    prompts.shift()
    
    let input = ""
    let good = false
    const filter = m => m
    const collector = thread.createMessageCollector({ filter, time: 60000 })
    
    collector.on("collect", m => {
        good = true
        input = m.content
        collector.stop()
    })

    // TODO handle no input scenario
    collector.on("end", m => {
        if (good) {
            res.push(input)
            getInput(thread, prompts, res, finished)
        }
    })
}



async function processInput(thread, res) {
    const data = {
        "Name": res[1],
        "Email": res[2],
        "Phone": res[3],
        "Instruments": res[4].split(", "),
        "Discord_ID": res[0],
        "Status": "UNKNOWN",
    }
    db.addToFirestore("Teachers", data)
    await thread.send("You have been successfully registered!\nThis will now be archived in 10 seconds.")
    setTimeout(async () => await thread.setArchived(true), 10000)
}


async function inputThread(interaction, prompts) {
    // TODO handle when thread archives whilst user is still inputting
    const thread = await interaction.channel.threads.create({
        "name": "Input Thread",
        "autoArchiveDuration": 60,
        "reason": "Get input from user.",
    })
    
    getInput(thread, prompts, [interaction.user.id], processInput)
}



module.exports = {
    data: new SlashCommandBuilder()
            .setName("teacher")
            .setDescription("Commands relating to teacher.")
            .addSubcommandGroup(commandGroup => 
                commandGroup
                    .setName("info")
                    .setDescription("Get and manipulate information about teacher.")
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName("get")
                            .setDescription("Get information about a teacher.")
                            .addStringOption(option => 
                                option
                                    .setName("name")
                                    .setDescription("The teacher's full name.")
                                    .setRequired(true)))
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName("update")
                            .setDescription("Change information about a teacher.")
                            .addStringOption(option => 
                                option
                                    .setName("name")
                                    .setDescription("The teacher's full name.")
                                    .setRequired(true))))
            .addSubcommand(subcommand => 
                subcommand
                    .setName("register")
                    .setDescription("Register yourself as a teacher")),

    async execute(interaction) {
        console.log(interaction.options)
        const subcommand = interaction.options.getSubcommand()

        if (subcommand == "register") {
            const userId = interaction.user.id 
            console.log(`Registering user ${userId} as a teacher...`)
            db.searchByFields("Teachers", {"ID": userId})
                .then(docs => docs.map(doc => Teacher.fromObj(doc)))
                    .then(async docs => {
                        if (docs.length == 0) {
                            // TODO make this create a new thread (for organization purposes)
                            const prompts = ["What your full name?", 
                                            "What email should people use to contact you?", 
                                            "What phone number should people use to contact you?",
                                            `What instrument(s) are you teaching?
        If you are teaching multiple instruments please separate different instruments by a comman followed by a space.
        e.g Piano, Trombone`,]
                            
                            inputThread(interaction, prompts)
                            await interaction.reply({ 
                                content: "Please enter your information in the thread.", 
                                ephemeral: true
                            })
                            /*
                            const row = new MessageActionRow()
                                .addComponents(
                                    new MessageSelectMenu()
                                        .setCustomId(docRef.id)
                                        .setPlaceholder("Nothing selected")
                                        .addOptions([
                                            {
                                                label: "Unknown",
                                                description: "Unsure if able to accept new students or not.",
                                                value: "UNKNOWN",
                                            },
                                            {
                                                label: "Open",
                                                description: "Accepting new students at the moment.",
                                                value: "OPEN",
                                            },
                                            {
                                                label: "Closed",
                                                description: "Refusing new students at the moment.",
                                                value: "CLOSED",
                                            },
                                        ])
                                )
                            await interaction.reply({ content: "What is your current status on taking in students?", components: [row] })
                            */
                        } else {
                            const queryRes = new MessageEmbed()
                                .setColor("#f7f7f")
                                .setTitle("Someone is already in the system!")
                                .setDescription("There seems to be atleast 1 person in the system that shares the same discord ID as you!")
                            
                            const embeds = [ queryRes, ]
                            docs.forEach((doc, i) => {
                                const hit = doc.toEmbed()
                                hit.setTitle(`User #${i + 1}`)
                                embeds.push(hit)
                            })
                            await interaction.reply({ 
                                embeds,
                                ephemeral: true })
                        }
                    })
                } else {
                    const group = interaction.options.getSubcommandGroup()

                    if (group === "info") {
                        const name = interaction.options.getString("name")
                        switch (subcommand) {
                            case "get":
                                console.log("Getting...")
                                break
                            case "update":
                                console.log("Updating...")
                                break
                            default :
                                console.log(`Unknown subcommand: ${subcommand}`)
                        }
                        await interaction.reply("D:")
                    } else {
                        console.log(`Unknown subcommand group: ${group}`)
                    }
                }
    }
}

