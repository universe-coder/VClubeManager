import { Connect } from "./Connect"
import { Module } from "./Module"
import { EnteredUser } from "./Interface/CommandManager"
import { MainController } from "./MainController"
import { Data } from "./Interface/MainController"
import { Admin } from "./Models/Admin"
import { Block } from "./Models/Block"
import { Log } from "./Models/Log"

export class CommandManager extends Module {

    private blocks: Block
    private logs: Log
    private admins: Admin
    private type: string
    private text: string
    conn: Connect

    constructor (connection: Connect, data: Data) {

        super(global.config.host.club_id, data, connection)

        this.blocks = new Block()
        this.logs = new Log()
        this.admins = new Admin()
        
        this.type = data.type
        this.text = String((data.text) ? data.text : '')

    }

    async init (): Promise<void> {

        let date = this.date

        if (this.user_id == Number(global.config.host.user_id))
            date -= 2

        await this.logs.insert(
            [String(this.club_id), String(this.user_id), this.type, this.text, String(date)],
            'NULL, ?, ?, ?, ?, ?'
        )

        if (this.type == 'enter' && global.config.welcome_message.enable) {

            const enterUserInfo = this.findEntered(this.user_id)

            if (!enterUserInfo) {

                await MainController.sleep(2000)
                this.createMessage(global.config.welcome_message.text)
                this.conn.enteredUsers[this.conn.enteredUsers.length] = { user_id: this.user_id, date: this.date }

            }            

        }
        
        const message = await this.command(this.text)
        if (message)
            this.createMessage(message)
    }

    async command (text: string): Promise<string> {
        const splitText = text.split(' ');
        let index = -1

        if ((index = CommandManager.searchCom(splitText, '!admin')) == 0)
            return await this.admin(
                splitText[index+1] as 'add' | 'remove' | 'list', 
                Number(splitText[index+2])
            )
        
        if ([0, 1].indexOf(index = CommandManager.searchCom(splitText, '!stats')) > -1)
            return await this.stats(Number(splitText[index+1]))

        if (await this.isAdmin()) {

            if ((index = CommandManager.searchCom(splitText, '!help')) == 0)
                return this.help()

            if ([0, 1].indexOf(index = CommandManager.searchCom(splitText, '!kick')) > -1)
                return await this.kick(Number(splitText[index+1]))

            if ([0, 1].indexOf(index = CommandManager.searchCom(splitText, '!ban')) > -1) {

                let duration = 0

                if (this.data.to_id) {
                    if (Number(splitText[index+1]))
                        duration = Number(splitText[index+1])
                    
                    return await this.ban(this.data.to_id, duration)
                }else {

                    if (splitText[2])
                        duration = Number(splitText[2])

                    return await this.ban(Number(splitText[1]), duration)
                }
                
            }

            if ((index = CommandManager.searchCom(splitText, '!unban')) == 0)
                return this.unban(Number(splitText[index+1]))

        }
    }

    findEntered (user_id: number): EnteredUser | false {

        for (let i = 0; i < this.conn.enteredUsers.length; i++) {

            const user = this.conn.enteredUsers[i]

            if (user.user_id == user_id) {

                if (user.date > (this.date - global.config.welcome_message.interval))
                    return user
                else
                    this.conn.enteredUsers.splice(i, 1)

                break

            }
            
        }

        return false

    }

    async stats (user_id?: number): Promise<string> {

        if(!user_id)
            user_id = this.data.to_id

        if (user_id) {

            return `
ID: ${user_id}; 
Сообщении: ${await this.countEvents(user_id, 'chat')}; 
Лайков: ${await this.countEvents(user_id, 'like')};
Дизлайков: ${await this.countEvents(user_id, 'dislike')};
Суперлайков: ${await this.countEvents(user_id, 'superlike')};
Песен: ${await this.countEvents(user_id, 'start_song')}
            `

        }

        return '';

    }

    async countEvents (to_id: number, eventName: string): Promise<number> {

        return (await this.logs.select(
            [to_id, this.club_id, eventName] as string[], 
            `WHERE user_id=? AND club_id=? AND type=?`
        )).length

    }

    static searchCom (text: string[], name: string): number {

        for (let i = 0; i < text.length; i++)
            if (text[i] == name)
                return i

        return -1

    }

    help (): string {

        return 'Список актуальных команд доступен в группе проекта'

    }

    async kick (user_id?: number): Promise<string> {

        if (!user_id)
            user_id = this.data.to_id

        if (user_id) {

            if (await this.isAdmin(user_id))
                return 'Вы не можете исключать других администраторов!'

            this.conn.send({ type: "club_ban", user_id: user_id })
            return 'Пользователь исключен из клуба'
            
        }

    }

    async ban (user_id?: number, duration: number = 0): Promise<string> {

        if (user_id) {

            if (await this.isAdmin(user_id))
                return 'Вы не можете банить других администраторов!'

            if (await this.isBanned(user_id))
                return 'Данный пользователь уже забанен!'

            if (duration > 0)
                duration = this.date + duration

            const parms = [String(this.club_id), String(user_id), String(this.user_id), String(duration), String(this.date)]

            await this.blocks.insert(parms, 'NULL,?,?,?,?,?')

            this.conn.send({
                type: "club_ban",
                user_id: user_id
            })

            return `Пользователь забанен на срок: ${(duration) ? (duration - this.date)+' секунд' : 'навсегда'}`

        }

    }

    unban (user_id: number): string {

        this.blocks.delete(
            [String(this.club_id), String(user_id)], 
            'WHERE club_id=? AND user_id=?'
        )
        return 'Пользователь успешно разблокирован! Блокировка в игре спадёт через сутки.'

    }

    async admin (command: 'add'|'remove'|'list', user_id?:number): Promise<string> {

        let message = ''

        if (await this.isAdmin(this.user_id)) {

            if (!user_id)
                return 'Не указан параметр user_id!'

            if (!await this.isAdmin(this.user_id, true))
                return 'У Вас нет доступа к этой команде!';

            switch (command) {
                case 'add':
                    if (await this.isAdmin(user_id))
                        message = 'Пользователь уже добавлен в администраторы!'

                    this.admins.insert([
                        String(this.club_id), String(user_id), String(this.date)], 
                        'NULL,?,?,0,?'
                    )
                    message = 'Пользователь назначен администратором клуба'
                    break;
                case 'remove':
                    this.admins.delete([String(this.club_id), String(user_id)], `WHERE club_id=? AND user_id=? LIMIT 1`)
                    message = 'Пользователь удален из администрации клуба'
                    break;
            }

        }
        

        if (command == 'list') {

            const res: Admin[] = await this.admins.select([String(this.club_id)], 'WHERE club_id=?') as Admin[]
            
            const adminsArr = []

            while (adminsArr.length < res.length)
                adminsArr[adminsArr.length] = "id" + res[adminsArr.length].user_id

            message = 'Администраторы клуба: ' + adminsArr.join(', ')

        }

        return message

    }

    private async createMessage (text: string): Promise<void> {

        text = this.data.clubber.name + ', ' + text

        this.conn.send({
            type: "chat",
            text: text,
            to_id: this.user_id
        })

    }

}
