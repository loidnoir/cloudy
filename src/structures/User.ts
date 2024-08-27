import { User as PrismaUser } from '@prisma/client'
import Client from '@structures/Client'
import Logger from '@utils/Logger'
import TaskManager from '@utils/TaskManager'

export default class User {
    private client: Client
    private data: PrismaUser

    constructor(client: Client, data: PrismaUser) {
        this.client = client
        this.data = data
    }

    public setAbout(about: string): void {
        this.data.about = about
        this.save()
    }

    public getAbout(): string {
        return this.data.about
    }

    public static async isUser(client: Client, id: string): Promise<boolean> {
        return client.appUsers.has(id) ? true : false
    }

    public static async get(client: Client, id: string): Promise<User> {
        let user = client.appUsers.get(id)

        if (!user) {
            let userQuery = await client.prisma.user.upsert({
                where: { id },
                create: { id },
                update: {},
            })

            user = new User(client, userQuery)
            client.appUsers.set(id, user)
        }

        return user
    }

    public async save(): Promise<void> {
        await this.client.prisma.user
            .upsert({
                where: { id: this.data.id },
                create: this.data,
                update: this.data,
            })
            .catch(() => {})
    }

    public async addTask(expiresAt: Date, response: string): Promise<void> {
        const task = await this.client.prisma.task
            .create({
                data: {
                    response,
                    expiresAt,
                    user: {
                        connectOrCreate: {
                            create: this.data,
                            where: { id: this.data.id },
                        },
                    },
                },
            })
            .catch(() => {})

        if (!task) return

        TaskManager.addTask(this.client, task)
    }

    public async deleteTask(id: string): Promise<void> {
        await this.client.prisma.task
            .delete({
                where: { id },
            })
            .catch(() => {})

        Logger.infoMessage(`Deleted task ${id}`)
        TaskManager.removeTask(this.client, id)
    }

    public async clearTasks(): Promise<void> {
        await this.client.prisma.task
            .deleteMany({
                where: {
                    user: {
                        id: this.data.id,
                    },
                },
            })
            .catch(() => {})

        Logger.infoMessage(`Cleared tasks for ${this.data.id}`)
        TaskManager.clearUserTasks(this.client, this.data.id)
    }

    public async getTasks(): Promise<TaskResponse[] | undefined> {
        const Tasks = await this.client.prisma.task
            .findMany({
                where: {
                    user: {
                        id: this.data.id,
                    },
                },
            })
            .catch(() => {})

        if (!Tasks) return

        const TasksResponse = Tasks.map(Task => {
            return {
                id: Task.id,
                response: Task.response,
                expiresAt: Task.expiresAt,
            } as TaskResponse
        })

        return TasksResponse
    }
}

interface TaskResponse {
    id: string
    response: string
    expiresAt?: Date
}
