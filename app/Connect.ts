import { MainController } from "./MainController"
import WebSocket from 'ws'
import { CommandManager } from "./CommandManager"
import { Security } from "./Security"
import { EnteredUser } from "./Interface/CommandManager"
import * as readline from 'readline'

export class Connect extends MainController {

    url: string
    socket: WebSocket
    enteredUsers: EnteredUser[]
    CM: CommandManager

    constructor () {
        
        super()
        this.url = 'wss://club-vk-2020.ciliz.com/ws'
        this.enteredUsers = []

    }

    run (): void {

        console.log('Подключение...')

        this.socket = new WebSocket(this.url, {
            origin: "https://209.selcdn.ru",
            followRedirects: false,
            handshakeTimeout: 20000
        })
    
        this.socket.on("close", (err: number) => this.onclose(err))
        this.socket.on('error', (err: string) => console.log(err))
        this.socket.on('message', (data) => this.onmessage(data))
        this.socket.on('pong', () => this.pong())
        this.socket.on('ping', () => this.ping())
        this.socket.on('open', () => this.onopen())

    }

    onclose (errInfo: number): void {

        if (errInfo == 1000) {
            console.log(`${global.config.host.user_id}: Проблема с токеном!`)
        }else {
            this.reconnect(String(errInfo))
        }

    }

    async reconnect (err: string): Promise<void> {

        await MainController.sleep(50000)
        this.run()
        console.log(`${global.config.host.user_id}: Переподключение! (${err})`)

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

            switch (data.type) {
                case 'enter':
                    console.log(`${data.clubber.name} (${data.clubber.id}): Подключился(-ась)`);
                    break;
                case 'leave':
                    console.log(`${data.clubber.name} (${data.clubber.id}): Отключился(-ась)`);
                    break;
            }

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
            id: global.config.host.user_id,
            auth: global.config.host.token,
            club_id: global.config.host.club_id,
            referrer_type: 0,
            referrer_id: `group_${global.config.host.club_id}`,
            system_id: global.config.host.system_id
        })

        this.send({
            type: "set_user_agent",
            user_agent: "windows"
        })

        setTimeout(() => {
            this.send({ type: "ping" })
        }, 3000)

        console.log(`Вы подключились к клубу!`)
        this.consoleRead()

    }

    send (data): void {

        this.socket.send(JSON.stringify(data))

    }

    async consoleRead () {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Команда: \n', async (answer) => {
            const CM: CommandManager = new CommandManager(
                this, 
                {
                    type: "chat",
                    text: answer,
                    is_new: false,
                    to_id: 0,
                    clubber: {
                        id: global.config.host.user_id,
                        name: ""
                    }
                }
            )
            
            console.log(await CM.command(answer));
            
            rl.close();
            this.consoleRead()
        });
    }

}
