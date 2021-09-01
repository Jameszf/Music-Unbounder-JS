
const { SlashCommandBuilder } = require("@discordjs/builders")


module.exports = {
    data: new SlashCommandBuilder()
            .setName("student")
            .setDescription("Commands relating to students.")
            .addSubcommandGroup(commandGroup => 
                commandGroup
                    .setName("info")
                    .setDescription("Get and manipulate information about students.")
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName("get")
                            .setDescription("Get information about a student.")
                            .addStringOption(option => 
                                option
                                    .setName("name")
                                    .setDescription("The student's full name.")
                                    .setRequired(true)))
                    .addSubcommand(subcommand =>
                        subcommand
                            .setName("update")
                            .setDescription("Change information about a student.")
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
        }
    }
}

