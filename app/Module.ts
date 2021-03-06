import { Connect } from "./Connect"
import { DB } from "./DB"
import { MainController } from "./MainController"

export class Module extends MainController {

    user_id: number
    club_id: number
    data: any
    database: DB
    date: number
    conn: Connect

    constructor (club_id: number, data: any, database: DB, conn: Connect) {

        super()
        this.database = database
        this.club_id = club_id
        this.user_id = Number(data.clubber.id)
        this.data = data
        this.date = Math.floor(+new Date() / 1000)
        this.conn = conn

    }

    async isAdmin (user_id: number = this.user_id, isCanAdd: boolean = false): Promise<boolean> {

        if (this.conn.config.super_admin == user_id)
            return true

        let res = await this.database.select('admins', [String(this.club_id), String(user_id)], `WHERE club_id=? AND user_id=? LIMIT 1`)

        if (isCanAdd && res.length > 0)
            return Number(res[0].can_add) == 1
        
        return res.length > 0

    }

    async isBanned (user_id: number): Promise<boolean> {

        const res = await this.database.select('blocks', [String(this.club_id), String(user_id), String(this.date)], 'WHERE club_id=? AND user_id=? AND (duration>? OR duration=0) LIMIT 1')

        return res.length > 0

    }

}