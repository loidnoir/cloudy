import Config from '@constants/Config'
import Event from '@structures/Event'
import ask from '@utils/AskGPT'

const messageEvent = new Event('messageCreate').setLogic(async (client, message) => {
    if (message.author.bot) return
    if (!Config.isUser(message.author) && !Config.isAdmin(message.author.id)) return
    if (!message.channel.isDMBased()) {
        const aliases = Config.getConfig().system.aliases
        const isMessageContainAlias = message.content.split(' ').some(word => aliases.includes(word))

        if (!isMessageContainAlias) return
    }

    await message.channel.sendTyping().then(async a => {
        const response = await ask(client, message.author.id, message.content)
        await message.reply({ content: response ?? 'Something went wrong', allowedMentions: { repliedUser: false } })
    })
})

export default messageEvent
