
const { MessageEmbed } = require("discord.js")
const { SlashCommandBuilder } = require("@discordjs/builders")
const { getRegsByName } = require("../firestore.js")



function makeFields(doc, order, inlines) {
    const fields = []
    const mapping = {
        "ID": "Document ID",
        "Phone": "Phone Number", 
        "Joined_On": "Joined On",
        "Found": "Found us from",
    }

    for (let field of order) {
        const inline = inlines.has(field)
        let key = mapping[field], value = doc[field]
        if (key == undefined) key = field
        if (value == "" || value == undefined) value = "N/A"
        fields.push({name: key, value, inline})
    }

    return fields
}



async function infoGet(interaction) {
    console.log("Getting...")
    const name = interaction.options.getString("name")
    getRegsByName(name).then(async docs => {
        const embeds = []
        const regs = docs.map(doc => Registered.fromObj(doc))
        
        const queryRes = new MessageEmbed()
            .setColor("#f7f7f7")
            .setTitle(`Query Results`)
            .setDescription(`Found ${docs.length} individual(s) named ${name}`)
        embeds.push(queryRes)

        regs.forEach(reg => embeds.push(reg.toEmbed()))
        await interaction.reply({embeds})
    })
}



function infoUpdate(interaction) {
    /*
    const thread = interaction.channel.threads.create({
        name: "Update",
        autArchiveDuration: ,
        reason: 30,
    }) 
    */
}



module.exports = {
    data: new SlashCommandBuilder()
            .setName("registered")
            .setDescription("Commands relating to registered individuals.")
            .addSubcommandGroup(commandGroup => 
                commandGroup
                    .setName("info")
                    .setDescription("Get and manipulate information about registered individuals.")
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName("get")
                            .setDescription("Get information about an registered individual.")
                            .addStringOption(option => 
                                option
                                    .setName("name")
                                    .setDescription("The individuals's full name.")
                                    .setRequired(true)))
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName("update")
                            .setDescription("Change information about an registered individual.")
                            .addStringOption(option => 
                                option
                                    .setName("name")
                                    .setDescription("The individual's full name.")
                                    .setRequired(true)))
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName("create")
                            .setDescription("Enter a registered individual's information into the system.")
                            .addStringOption(option => 
                                option
                                    .setName("name")
                                    .setDescription("The student's full name.")
                                    .setRequired(true)))),
    async execute(interaction) {
        console.log(interaction.options)
        const group = interaction.options.getSubcommandGroup()
        if (group === "info") {
            const subcommand = interaction.options.getSubcommand()
            switch (subcommand) {
                case "get":
                    infoGet(interaction)
                    break
                case "update":
                    name = interaction.options.getString("name")
                    console.log("Updating...")
                    await interaction.reply("D:")
                    break
                case "create":
                    console.log("Creating...")
                    await interaction.reply("D:")
                    break
                default :
                    console.log(`Unknown subcommand: ${subcommand}`)
            }
        }
    }
}

