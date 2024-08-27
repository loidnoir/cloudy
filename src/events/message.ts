import Config from '@constants/Config'
import Event from '@structures/Event'
import ask from '@utils/AskGPT'

const messageEvent = new Event('messageCreate').setLogic(async (client, message) => {
    if (!message.channel.isDMBased()) return
    if (message.author.bot) return
    if (!Config.isUser(message.author) && !Config.isAdmin(message.author.id)) return

    await message.channel.sendTyping().then(async a => {
        const response = await ask(client, message.author.id, message.content)
        await message.reply(response ?? 'Something went wrong')
    })
})

export default messageEvent
