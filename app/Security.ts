import { Module } from "./Module"
import { Connect } from "./Connect"
import { Data } from "./Interface/MainController"
import { Log } from "./Models/Log"

export class Security extends Module {

    private sendData: string[]
    private timeLimit: number = 1
    private countLimit: number = 3
    conn: Connect

    constructor (connection: Connect, data: Data) {

        super(global.config.host.club_id, data, connection)

        this.sendData = []

    }

    async init (): Promise<string[]> {

        if ((await this.isBanned(this.data.clubber.id)) == false) {

            await this.checkFlood('chat')
            await this.checkFlood('enter')
            await this.checkFlood('like')
            await this.checkFlood('dislike')
            await this.checkFlood('superlike')

        }else {

            await this.userKick(this.data.clubber.id)

        }

        return this.sendData

    }

    async checkFlood (type: string): Promise<void> {

        switch (type) {

            case 'chat':
                this.countLimit = global.config.limits.messages.count
                this.timeLimit = global.config.limits.messages.time
                break
            case 'enter':
                this.countLimit = global.config.limits.enter.count
                this.timeLimit = global.config.limits.enter.time
                break
            case 'like':
                this.countLimit = global.config.limits.likes.count
                this.timeLimit = global.config.limits.likes.time
                break
            case 'dislike':
                this.countLimit = global.config.limits.dislikes.count
                this.timeLimit = global.config.limits.dislikes.time
                break
            case 'superlike':
                this.countLimit = global.config.limits.superlikes.count
                this.timeLimit = global.config.limits.superlikes.time
                break

        }

        const duration = this.date - this.timeLimit
        const logs = new Log()
        const res: Log[] = await logs.select(
            [String(this.club_id), type, String(duration)], 
            'WHERE club_id=? AND type=? AND date>?'
        ) as Log[]

        if (res && res.length >= this.countLimit) {

            for await (const r of res) {

                if (!(await this.isAdmin(r.user_id)))
                    await this.userKick(r.user_id)

            }

        }

    }

    async userKick (user_id: number): Promise<void> {

        this.conn.send({ type: "club_ban", user_id: user_id })

    }

}