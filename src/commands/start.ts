import Client from '@structures/Client'
import Command from '@structures/Command'
import Component from '@structures/Component'
import User from '@structures/User'
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChatInputCommandInteraction,
    MessageActionRowComponentBuilder,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    SlashCommandBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js'

const startCommand = new Command<SlashCommandBuilder>()
    .setData(new SlashCommandBuilder().setName('start').setDescription('Start the app setup').setDMPermission(true))
    .setLogic((client, interaction) => {
        initialQuestion(client, interaction)
    })

const initialQuestion = function (client: Client, interaction: ChatInputCommandInteraction) {
    const id = `${interaction.id}-start-initial`

    const buttons = [
        new ButtonBuilder()
            .setLabel('Yes')
            .setStyle(ButtonStyle.Success)
            .setCustomId(id + '-yes'),
        new ButtonBuilder()
            .setLabel('No')
            .setStyle(ButtonStyle.Danger)
            .setCustomId(id + '-no'),
    ]

    const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(buttons)

    const component = new Component<ButtonBuilder>(client, id).setLogic((client, interaction) => {
        if (interaction.customId.endsWith('yes')) {
            aboutQuestion(client, interaction)
            component.delete()
        } else {
            interaction.update({ content: 'Understood', components: [] })
            component.delete()
        }
    })

    interaction.reply({
        ephemeral: true,
        components: [actionRow],
        content: `Hello **${interaction.user.username}**, I am Cloudy, your assistant for scheduling tasks, learning about new things, saving notes and more.\n\nIf you would like to use my services, please confirm. By doing so, you agree to let me store and use your data to improve your experience.`,
    })
}

const aboutQuestion = function (client: Client, interaction: ButtonInteraction) {
    const id = `${interaction.id}-start-about`

    const modal = new ModalBuilder().setCustomId(id).setTitle('About you')

    const aboutInput = new TextInputBuilder()
        .setCustomId('about')
        .setLabel('Tell us about you')
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(10)
        .setMaxLength(200)

    const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(aboutInput)

    modal.addComponents(actionRow)

    const component = new Component<ModalBuilder>(client, id).setLogic(async (client, modalInteraction) => {
        const user = await User.get(client, interaction.user.id)
        const about = modalInteraction.fields.getTextInputValue('about')

        user.setAbout(about)

        interaction.editReply({
            content: 'Thank you, now as I have some information about you, I am ready to help you!',
            components: [],
        })

        modalInteraction.deferUpdate()
        component.delete()
    })

    interaction.showModal(modal)
}

export default startCommand
