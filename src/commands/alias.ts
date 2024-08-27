import Config from '@constants/Config'
import Command from '@structures/Command'
import Logger from '@utils/Logger'
import { SlashCommandBuilder } from 'discord.js'

const commandData = new SlashCommandBuilder()
    .setName('alias')
    .setDMPermission(true)
    .setDescription('Control the aliases')

commandData.addStringOption(option => option.setName('alias').setDescription("Alias's name").setRequired(true))

const aliasCommand = new Command<SlashCommandBuilder>().setData(commandData).setLogic((client, interaction) => {
    if (interaction.user.id != Config.admin) return

    const alias = interaction.options.getString('alias', true)

    Config.addAlias([alias])
    Logger.infoMessage(`Alias added: ${alias}`)
    interaction.reply({ content: 'Alias added', ephemeral: true })
})

export default aliasCommand
