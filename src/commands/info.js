

const db = require("./firestore.js")
const { MessageEmbed } = require("discord.js")


function capitialize(name) {
    return name.trim().replace(/^\w/, (c) => c.toUpperCase());
}


module.exports = {
    data: new SlashCommandBuilder()
            .setName("info")
            .setDescription("Commands to get information.")
            .addStringOption(option => option
                .setName("name")
                .setDescription("Full name of the student."))
    async execute(interaction) {
        console.log(interaction.options)
        const name = interaction.options.getString("name")

        if (name) {
            console.log(name)
            const searchSpaces = ["Registered", "Teachers"]
            const queries = []
            searchSpaces.forEach(collection => {
                const query = db.searchByFields(collection, {name: capitialize(name)})
                queries.push(query)
            })

            Promise.all(queries).then(res => {
                console.log(`Found ${results.length} results for ${name}`)
                console.log(results)

                const embed = new MessageEmbed()
                      .setColor("#FFFFFF")
                      .setTitle(`${results.length}`)

                res.forEach((values, i) => {
                    values.forEach(val => {
                        embed.addField(searchSpaces[i], val, false)
                    })
                })
                
                interaction.reply({embeds: [embed], ephemeral: true})
           }).catch(err => {
               interaction.reply({ content: "An error occurred whilst executing your command.", ephemeral: true})
               console.error(err)
           })
        } else {
            // DB metadata
            const importCollects = ["Registered", "Teachers", "Students"]
            const queries = []

            importCollects.forEach(collect => {
                const query = db.getAllDocs(collect)
                queries.push(query)
            })


	        Promise.all(queries).then(res => {
                let str = ""
                res.forEach((collect, i) => {
                    str += `${collect.length} ${importCollects[i]}`
                })
	            interaction.reply({content: str, ephemeral: true})
            }).catch(err => {
                interaction.reply({ content: "An error occurred whilst executing your command.", ephemeral: true})
                console.error(err)
            })
        }
    }
}



