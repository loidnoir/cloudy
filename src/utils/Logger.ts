import * as colors from 'colors'

colors.enable()

export default class Logger {
    public static successMessage(message: string, isBold: boolean = false): void {
        console.log(isBold ? message.green.bold : message.green)
    }

    public static infoMessage(message: string, isBold: boolean = false): void {
        console.log(isBold ? message.blue.bold : message.blue)
    }

    public static errorMessage(message: string, isBold: boolean = false): void {
        console.log(isBold ? message.red.bold : message.red)
    }
}
