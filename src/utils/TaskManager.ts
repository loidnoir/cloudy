import { Task } from '@prisma/client'
import Client from '@structures/Client'
import Logger from './Logger'

export default class TaskManager {
    public static scheduleTask(client: Client) {
        if (client.tasks.length === 0) return
        if (client.isTaskRunning) return

        client.isTaskRunning = true

        const nextTask = client.tasks[0]
        const delay = nextTask.expiresAt.getTime() - Date.now()

        Logger.infoMessage(`Scheduling task ${nextTask.id} to run in ${delay / 1000} seconds`)

        client.timeout = setTimeout(() => {
            Logger.infoMessage(`Executing task ${nextTask.id} at ${new Date()}`)

            client.users.cache.get(nextTask.userId)?.send(nextTask.response)
            client.tasks.shift()
            client.prisma.task.delete({ where: { id: nextTask.id } })
            client.isTaskRunning = false

            TaskManager.scheduleTask(client)
        }, delay)
    }

    public static stopTasks(client: Client) {
        client.isTaskRunning = false
        clearTimeout(client.timeout)
    }

    public static addTask(client: Client, newTask: Task) {
        const insertionIndex = client.tasks.findIndex(task => task.expiresAt > newTask.expiresAt)

        if (insertionIndex == 0) {
            client.tasks.unshift(newTask)
            TaskManager.stopTasks(client)
        } else if (insertionIndex == -1) {
            client.tasks.push(newTask)
        } else {
            client.tasks.splice(insertionIndex, 0, newTask)
        }

        Logger.infoMessage(
            `Added task ${newTask.id} to queue to run in ${(newTask.expiresAt.getTime() - Date.now()) / 1000} seconds`
        )
        TaskManager.scheduleTask(client)
    }

    public static removeTask(client: Client, taskId: string) {
        const taskToRemove = client.tasks.find(task => task.id === taskId)
        client.tasks = client.tasks.filter(task => task.id !== taskId)

        if (taskToRemove && client.tasks[0]?.id === taskId) {
            TaskManager.stopTasks(client)
        }

        TaskManager.scheduleTask(client)
    }

    public static clearUserTasks(client: Client, userId: string) {
        const isActiveTaskForUser = client.tasks.length > 0 && client.tasks[0].userId === userId

        client.tasks = client.tasks.filter(task => task.userId !== userId)

        if (isActiveTaskForUser) {
            TaskManager.stopTasks(client)
        }

        TaskManager.scheduleTask(client)
    }
}
