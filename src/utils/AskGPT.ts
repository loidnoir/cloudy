import Client from '@structures/Client'
import User from '@structures/User'
import Logger from '@utils/Logger'
import Config from '../constants/Config'

export default async function ask(client: Client, userId: string, message: string) {
    const user = await User.get(client, userId)
    const isLoid = userId == Config.admin ? 'User is your creator' : ''
    const date = new Date()

    const armenianTime = date
        .toLocaleString('en-CA', {
            timeZone: 'Asia/Yerevan',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })
        .replace(', ', 'T')

    const formattedTime = `${armenianTime}+04:00`

    async function add_task(args: { expiration_ms: number; response: string }) {
        await user.addTask(new Date(date.getTime() + args.expiration_ms), args.response)
        return true
    }

    async function rem_task(args: { all?: boolean; id: string }) {
        if (args.all) {
            await user.clearTasks()
            return true
        }

        await user.deleteTask(args.id)
        return true
    }

    async function get_tasks(args: {}) {
        return await user.getTasks()
    }

    function about_user() {
        return user.getAbout()
    }

    const runner = client.openai.beta.chat.completions.runTools({
        model: 'gpt-4o-mini',
        max_tokens: 2000,
        temperature: 0.8,
        messages: [
            {
                role: 'system',
                content: `${Config.getConfig().system.description}\nCurrent time ${formattedTime}\n${isLoid}`,
            },
            {
                role: 'user',
                content: message,
            },
        ],
        tools: [
            {
                type: 'function',
                function: {
                    function: add_task,
                    description: 'Add task',
                    parse: JSON.parse,
                    parameters: {
                        type: 'object',
                        properties: {
                            expiration_ms: {
                                type: 'integer',
                                description: 'Duration in ms',
                            },
                            response: {
                                type: 'string',
                                description: "Response to send after it's done",
                            },
                        },
                    },
                },
            },
            {
                type: 'function',
                function: {
                    function: rem_task,
                    description: 'Remove task',
                    parse: JSON.parse,
                    parameters: {
                        type: 'object',
                        properties: {
                            all: {
                                type: 'boolean',
                                description: 'If true will remove all tasks',
                            },
                            id: {
                                type: 'string',
                                description: 'Task id',
                            },
                        },
                    },
                },
            },
            {
                type: 'function',
                function: {
                    function: get_tasks,
                    description: 'Get tasks',
                    parse: JSON.parse,
                    parameters: {},
                },
            },
            {
                type: 'function',
                function: {
                    function: about_user,
                    description: 'Info about user',
                    parse: JSON.parse,
                    parameters: {},
                },
            },
        ],
    })

    const finalContent = await runner.finalContent()
    const usageData = await runner.totalUsage()

    Logger.infoMessage(
        `Prompt: ${usageData.prompt_tokens}, Completion: ${usageData.completion_tokens}, Total: ${usageData.total_tokens}`
    )

    return finalContent
}
