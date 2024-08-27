import Config from '@constants/Config'
import Command from '@structures/Command'
import Logger from '@utils/Logger'
import { SlashCommandBuilder } from 'discord.js'

const currentDescription = Config.getConfig().system.description

const commandData = new SlashCommandBuilder()
    .setName('description')
    .setDescription('Change the system message description')
    .setDMPermission(true)

commandData.addStringOption(option =>
    option.setName('description').setDescription('The new description').setRequired(true)
)

const descriptionCommand = new Command<SlashCommandBuilder>().setData(commandData).setLogic((client, interaction) => {
    if (interaction.user.id != Config.admin) return

    const newDescription = interaction.options.getString('description', true)

    Config.setDescription(newDescription)
    Logger.infoMessage(`Description changed to ${newDescription}`)
    interaction.reply({ content: 'Description updated', ephemeral: true })
})

export default descriptionCommand
