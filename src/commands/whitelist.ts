import Config from '@constants/Config'
import Command from '@structures/Command'
import Logger from '@utils/Logger'
import { SlashCommandBuilder } from 'discord.js'

const commandData = new SlashCommandBuilder()
    .setDMPermission(true)
    .setName('whitelist')
    .setDescription('Control the whitelist')

commandData.addStringOption(option => option.setName('user').setDescription("User's Id").setRequired(true))

const whitelistCommand = new Command<SlashCommandBuilder>().setData(commandData).setLogic((client, interaction) => {
    if (interaction.user.id != Config.admin) return

    const userId = interaction.options.getString('user', true)

    if (Config.isUser(userId)) {
        Config.removeFromWhitelist(userId)
        Logger.infoMessage(`User ${userId} removed from whitelist`)
        interaction.reply({ content: 'User removed from whitelist', ephemeral: true })
    } else {
        Config.addToWhitelist(userId)
        Logger.infoMessage(`User ${userId} added to whitelist`)
        interaction.reply({ content: 'User added to whitelist', ephemeral: true })
    }
})

export default whitelistCommand
