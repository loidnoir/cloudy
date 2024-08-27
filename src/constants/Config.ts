import JsonManager from '@utils/JsonManager'
import { ActivityType, ClientOptions, Partials, User } from 'discord.js'

export default class Config {
    private static readonly configPath: string = __dirname + '/../../config.json'
    public static readonly token: string = process.env.TOKEN!
    public static readonly openAiToken: string = process.env.OPEN_AI_TOKEN!
    public static readonly admin: string = process.env.ADMIN!
    public static readonly client: ClientOptions = {
        intents: [
            'MessageContent',
            'Guilds',
            'GuildMembers',
            'GuildMessages',
            'GuildWebhooks',
            'GuildMessagePolls',
            'GuildMessageReactions',
            'GuildMessageTyping',
            'GuildPresences',
            'DirectMessages',
            'DirectMessagePolls',
            'DirectMessageTyping',
            'DirectMessageReactions',
        ],
        partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction],
        presence: {
            activities: [
                {
                    name: 'you',
                    type: ActivityType.Listening,
                },
            ],
        },
    }

    public static getConfig(): IConfig {
        return JsonManager.readFile(Config.configPath)
    }

    public static isAdmin(user: User | string): boolean {
        const id = typeof user === 'string' ? user : user.id
        return id == Config.admin
    }

    public static isUser(user: User | string): boolean {
        const id = typeof user === 'string' ? user : user.id
        return Config.getConfig().system.whitelist.includes(id)
    }

    public static addToWhitelist(user: User | string): void {
        const id = typeof user === 'string' ? user : user.id
        const data = JsonManager.readFile(Config.configPath) as IConfig

        if (!data.system.whitelist.includes(id)) {
            data.system.whitelist.push(id)
            JsonManager.writeJsonFile(Config.configPath, data)
        }
    }

    public static removeFromWhitelist(user: User | string): void {
        const id = typeof user === 'string' ? user : user.id
        const data = JsonManager.readFile(Config.configPath) as IConfig

        data.system.whitelist = data.system.whitelist.filter(entry => entry !== id)
        JsonManager.writeJsonFile(Config.configPath, data)
    }

    public static setDescription(description: string): void {
        const data = JsonManager.readFile(Config.configPath) as IConfig
        data.system.description = description
        JsonManager.writeJsonFile(Config.configPath, data)
    }

    public static addAlias(aliases: string[]): void {
        const data = JsonManager.readFile(Config.configPath) as IConfig
        data.system.aliases = data.system.aliases.concat(aliases)
        JsonManager.writeJsonFile(Config.configPath, data)
    }

    public static removeAlias(alias: string): void {
        const data = JsonManager.readFile(Config.configPath) as IConfig
        data.system.aliases = data.system.aliases.filter(entry => entry !== alias)
        JsonManager.writeJsonFile(Config.configPath, data)
    }
}

interface IConfig {
    system: {
        name: string
        description: string
        whitelist: string[]
        aliases: string[]
    }
}
