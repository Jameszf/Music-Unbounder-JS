
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

    let input
    let done = false
    while (!done) {
        const filter = m => true
        const collector = interaction.channel.creteMessageCollor({ filter, time: 30000 })
        
        collector.on("collect", m => {
            input = m.content
            done = true
            collector.stop()
        })

        collector.on("end", async m => {
            if (!done) {
                await interaction.reply({ content: "Please answer the question.", ephemeral: true })
            }
        })
    }
    return input
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
            console.log(`Registering user ${userId} as a teacher.`)
            db.getTeachersById(userId).then(async docs => {
                if (docs.length == 0) {
                    // TODO make this create a new thread (for organization purposes)
                    const proms = ["What your full name?", 
                                    "What email should people use to contact you?", 
                                    "What phone number should people use to contact you?",
                                    `What instrument(s) are you teaching?\n
                                    If you are teaching multiple instruments please separate different 
                                    instruments by a comman followed by a space.\ne.g Piano, Trombone`,]
                    const res = []
                    for (let prom of proms) {
                        res.push(await getUserInput(interaction, prom))
                    }

                    db.addTeacher({
                        "Discord_ID": userId,
                        "Name": res[0],
                        "Email": res[1],
                        "Phone": res[2],
                        "Instruments": res[3].split(", "),
                        "Status": "UNKNOWN",
                        "Lessons": [],
                    })
                
                    await interaction.reply({ content: "Successfully added you to the system!", ephemeral: true})
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
                    for (let i = 0; i < docs.length; i++) {
                        let doc = docs[i]
                        const fields = makeTeacherFields(doc)
                        const hit = new MessageEmbed()
                            .setColor("#f7f7f7")
                            .setTitle(`User #${i + 1}`)
                            .addFields(fields)
                        results.push(hit)
                    }
                    await interaction.reply({ 
                        embeds,
                        ephemeral: true })
                }
            })
            await interaction.reply("D:")
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

