
const { SlashCommandBuilder } = require("@discordjs/builders")


module.exports = {
    data: new SlashCommandBuilder()
            .setName("manage")
            .setDescription("Commands relating to students.")
            .addSubcommand(subcommand =>
                subcommand
                    .setName("takein")
                    .setDescription("Become the teacher of someone who has registered.")
                    .addStringOption(option => 
                        option
                            .setName("name")
                            .setDescription("The registered person's full name.")
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName("end")
                    .setDescription("Stop teaching a student.")
                    .addStringOption(option => 
                        option
                            .setName("name")
                            .setDescription("The student's full name.")
                            .setRequired(true))),
    async execute(interaction) {
        console.log(interaction.options)
        const subcommand = interaction.options.getSubcommand()
        const name = interaction.options.getString("name")
    
        switch (subcommand) {
            case "takein":
                console.log("Takin' in...")
                break
            case "end":
                console.log("Ending...")
                break
            default :
                console.log(`Unknown subcommand: ${subcommand}`)
        }
        await interaction.reply("D:")
    }
}

