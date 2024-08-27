import fs from 'fs'
import path from 'path'

export default class JsonManager {
    public static readFile(filePath: string): any {
        const resolvedPath = path.resolve(filePath)
        const data = fs.readFileSync(resolvedPath, 'utf8')

        return JSON.parse(data)
    }

    public static writeJsonFile(filePath: string, data: Object): void {
        const resolvedPath = path.resolve(filePath)
        fs.writeFileSync(resolvedPath, JSON.stringify(data, null, 2), 'utf8')
    }
}
