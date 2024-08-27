import Config from '@constants/Config'
import { PrismaClient, Task } from '@prisma/client'
import Logger from '@utils/Logger'
import { AutocompleteInteraction, Client as BaseClient, ClientEvents, Collection } from 'discord.js'
import fs from 'fs'
import * as cron from 'node-cron'
import OpenAI from 'openai'
import path from 'path'
import Command, { CommandBuilderTypes, CommandInteractionTypes } from './Command'
import Component, { ComponentInteractionTypes } from './Component'
import Event from './Event'
import User from './User'

export default class Client extends BaseClient {
    public prisma = new PrismaClient()
    public cron = cron
    public openai = new OpenAI({
        apiKey: Config.openAiToken,
    })

    private commandsPath?: string
    private eventsPath?: string

    public tasks: Task[] = []
    public timeout?: NodeJS.Timeout = undefined
    public isTaskRunning = false

    public components: Collection<string, Component<any>> = new Collection()
    public commands: Collection<string, Command<any>> = new Collection()
    public events: Collection<string, Event<keyof ClientEvents>> = new Collection()
    public cooldowns: Collection<string, number> = new Collection()

    public appUsers: Collection<string, User> = new Collection()

    cooldownError?: CooldownError
    componentError?: ComponentError
    commandError?: CommandError

    constructor() {
        super(Config.client)
    }

    public static start(): void {
        const client = new Client()
        const commandsPath = path.join(__dirname, '../commands')
        const eventsPath = path.join(__dirname, '../events')

        client.enableCommands(commandsPath)
        client.enableEvents(eventsPath)
        client.login()
    }

    public setCooldownError(error: CooldownError) {
        this.cooldownError = error
    }

    public setComponentError(error: ComponentError) {
        this.componentError = error
    }

    public setCommandError(error: CooldownError) {
        this.cooldownError = error
    }

    public enableCommands(path: string) {
        this.commandsPath = path
    }

    public enableEvents(path: string) {
        this.eventsPath = path
    }

    private async loadCommands(): Promise<void> {
        const stack = [this.commandsPath]

        while (stack.length > 0) {
            const currentPath = stack.pop()
            const entries = fs.readdirSync(currentPath!, {
                withFileTypes: true,
            })

            for (const entry of entries) {
                const fullPath = path.join(currentPath!, entry.name)

                if (entry.isDirectory()) {
                    stack.push(fullPath)
                } else if (entry.isFile()) {
                    const command: Command<CommandBuilderTypes> = (await import(fullPath)).default
                    if (!command.data) return

                    this.commands.set(command.data.name, command)

                    if (command.guild) {
                        let guild = this.guilds.cache.get(command.guild)

                        if (!guild) {
                            guild = await this.guilds.fetch(command.guild)
                        }

                        guild.commands.create(command.data)
                        Logger.infoMessage(`Guild command registered - ${command.data.name}`)
                    } else {
                        this.application?.commands.create(command.data)
                        Logger.infoMessage(`Command registered - ${command.data.name}`)
                    }
                }
            }
        }
    }

    private async loadEvents(): Promise<void> {
        const stack = [this.eventsPath]

        while (stack.length > 0) {
            const currentPath = stack.pop()
            const entries = fs.readdirSync(currentPath!, {
                withFileTypes: true,
            })

            for (const entry of entries) {
                const fullPath = path.join(currentPath!, entry.name)

                if (entry.isDirectory()) {
                    stack.push(fullPath)
                } else if (entry.isFile()) {
                    const event: Event<keyof ClientEvents> = (await import(fullPath)).default

                    if (event) {
                        if (event.once)
                            this.once(event.event, (...args) => {
                                try {
                                    if (event.logic) event.logic(this, ...args)
                                } catch (error) {
                                    console.log(error)
                                }
                            })
                        else
                            this.on(event.event, (...args) => {
                                try {
                                    if (event.logic) event.logic(this, ...args)
                                } catch (error) {
                                    console.log(error)
                                }
                            })

                        Logger.infoMessage(`Event registered - ${event.event}`)
                    }
                }
            }
        }
    }

    private handleCommands(interaction: CommandInteractionTypes) {
        const command = this.commands.get(interaction.commandName)

        if (command && command.logic) {
            if (command?.data && command.data.cooldownSeconds) {
                const id = `${interaction.commandName}-${interaction.user.id}`
                const cooldownState = this.cooldowns.get(id)
                const date = Date.now() + command.data.cooldownSeconds

                if (cooldownState) {
                    if (Date.now() > cooldownState) {
                        command.logic(this, interaction)
                        this.cooldowns.set(id, date)
                    } else {
                        if (this.cooldownError) {
                            this.cooldownError(this, interaction, new Date(cooldownState))
                        } else {
                            interaction.reply({
                                content: 'Command is on cooldown',
                                ephemeral: true,
                            })
                        }
                    }
                } else {
                    this.cooldowns.set(id, date)
                    command.logic(this, interaction)
                }
            } else {
                command.logic(this, interaction)
            }
        }
    }

    private handleComponents(interaction: ComponentInteractionTypes): void {
        const component = this.components.find(component => interaction.customId.startsWith(component.interactionId))

        if (component && component.logic) {
            if (component.isExpired()) {
                if (this.componentError) this.componentError(this, interaction)
                else
                    interaction.reply({
                        content: 'Interaction is expired',
                        ephemeral: true,
                    })
            } else {
                component.logic(this, interaction)
                component.addUsage(1)
            }
        }
    }

    private handleAutocomplete(interaction: AutocompleteInteraction): void {
        const command = this.commands.get(interaction.commandName)

        if (command && command.autocompleteLogic) {
            command.autocompleteLogic(this, interaction)
        }
    }

    public login() {
        if (this.eventsPath) this.loadEvents()

        this.once('ready', () => (this.commandsPath ? this.loadCommands() : null))
        this.on('interactionCreate', interaction => {
            if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit())
                this.handleComponents(interaction)
            else if (interaction.isCommand() && this.commandsPath) this.handleCommands(interaction)
            else if (interaction.isAutocomplete() && this.commandsPath) this.handleAutocomplete(interaction)
        })

        return super.login(Config.token)
    }
}

type ComponentError = (Client: Client, interaction: ComponentInteractionTypes) => void
type CooldownError = (client: Client, interaction: CommandInteractionTypes, expireDate: Date) => void
type CommandError = (client: Client, interaction: CommandInteractionTypes) => void
