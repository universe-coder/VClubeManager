import { MainController } from "./MainController"
import * as ws from 'ws'
import { CommandManager } from "./CommandManager"
import { Security } from "./Security"
import { EnteredUser } from "./Interface/CommandManager"

export class Connect extends MainController {

    url: string
    ws: any
    socket: any
    enteredUsers: EnteredUser[]

    constructor () {
        
        super()
        this.url = 'wss://club-vk-2020.ciliz.com/ws'
        this.ws = ws
        this.enteredUsers = []

    }

    run (): void {

        console.log('Connecting...')

        this.socket = new this.ws.WebSocket(this.url, {
            origin: "https://209.selcdn.ru",
            followRedirects: false,
            handshakeTimeout: 20000
        })
    
        this.socket.on("close", (err: number) => this.onclose(err))
        this.socket.on('error', (err: string) => {})
        this.socket.on('message', (data) => this.onmessage(data))
        this.socket.on('pong', () => this.pong())
        this.socket.on('ping', () => this.ping())
        this.socket.on('open', () => this.onopen())

    }

    onclose (errInfo: number): void {

        if (errInfo == 1000) {
            console.log(`${this.config.host.user_id}: Token problem!`)
        }else {
            this.reconnect(String(errInfo))
        }

    }

    async reconnect (err: string): Promise<void> {

        await MainController.sleep(50000)
        this.run()
        console.log(`${this.config.host.user_id}: reconnecting! (${err})`)

    }

    onmessage (data): void {

        data = JSON.parse(data.toString())        

        if (data.type == 'vote' && data.is_new == true) {

            data.clubber = { id: data.clubber_id }
            data.type = data.vote

        }else if (data.type == 'start_song') {

            data.clubber = { id: data.dj.id }

        }

        if (data.clubber?.id) {

            const CM: CommandManager = new CommandManager(this, data)
            CM.init()

            const sec = new Security(this, data)
            sec.init()

        }

    }

    async pong (): Promise<void> {

        await MainController.sleep(2000)
        this.send({ type: "ping" })

    }

    async ping (): Promise<void> {

        await MainController.sleep(2000)
        this.send({ type: "pong" })

    }

    onopen (): void {    

        this.send({
            type: "login",
            id: this.config.host.user_id,
            auth: this.config.host.token,
            club_id: this.config.host.club_id,
            referrer_type: this.config.host.club_id,
            referrer_id: `group_${this.config.host.club_id}`,
            system_id: this.config.host.system_id
        })

        this.send({
            type: "set_user_agent",
            user_agent: "windows"
        })

        setTimeout(() => {
            this.send({ type: "ping" })
        }, 3000)

        console.log(`${this.config.host.user_id}: Connected!`)

    }

    send (data): void {

        this.socket.send(JSON.stringify(data))

    }

}
