import Config from '@constants/Config'
import Client from '@structures/Client'
import Event from '@structures/Event'
import ask from '@utils/AskGPT'
import { Message } from 'discord.js'

const messageEvent = new Event('messageCreate').setLogic(async (client, message) => {
    if (message.author.bot) return
    if (!Config.isUser(message.author) && !Config.isAdmin(message.author.id)) return

    if (message.reference) {
        if (!message.reference.messageId) return
        const originalMessage = await message.channel.messages.fetch(message.reference.messageId)

        if (originalMessage.author.id == client.user?.id) {
            replyMessage(client, message, `Replying message: "${originalMessage.content}"`)
        }
    }

    if (!message.channel.isDMBased()) {
        const aliases = Config.getConfig().system.aliases
        const isMessageContainAlias = message.content.split(' ').some(word => aliases.includes(word))

        if (isMessageContainAlias) replyMessage(client, message)
    } else replyMessage(client, message)
})

async function replyMessage(client: Client, message: Message, context?: string) {
    await message.channel.sendTyping().then(async a => {
        const response = await ask(client, message.author.id, message.content, context)
        await message.reply({ content: response ?? 'Something went wrong', allowedMentions: { repliedUser: false } })
    })
}

export default messageEvent
