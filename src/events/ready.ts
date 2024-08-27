import Event from '@structures/Event'
import Logger from '@utils/Logger'
import TaskManager from '@utils/TaskManager'

const readyEvent = new Event('ready').setOnce(true).setLogic(async client => {
    Logger.successMessage('App is online', true)

    await client.prisma.task.deleteMany({
        where: {
            expiresAt: {
                lte: new Date(),
            },
        },
    })

    const tasks = await client.prisma.task
        .findMany({
            where: {
                expiresAt: {
                    gte: new Date(),
                },
            },
            orderBy: {
                expiresAt: 'asc',
            },
        })
        .catch(() => [])

    client.tasks = tasks

    TaskManager.scheduleTask(client)
})

export default readyEvent
