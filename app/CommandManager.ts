import { Connect } from "./Connect"
import { Module } from "./Module"
import { EnteredUser } from "./Interface/CommandManager"
import { MainController } from "./MainController"

export class CommandManager extends Module {

    private type: string
    private text: string
    conn: Connect

    constructor (connecttion: Connect, data: any) {

        super(connecttion.config.host.club_id, data, connecttion.db, connecttion)

        this.type = String(data.type)
        this.text = String((data.text) ? data.text : '')

    }

    async init (): Promise<void> {

        let date = this.date

        if (this.user_id == Number(this.conn.config.host.user_id))
            date -= 2

        await this.database.insert('logs(club_id, user_id, type, text, date)', 
                                [String(this.club_id), String(this.user_id), this.type, this.text, String(date)],
                                '?, ?, ?, ?, ?')

        if (this.type == 'enter' && this.conn.config.welcome_message.enable) {

            const enterUserInfo = this.findEntered(this.user_id)

            if (!enterUserInfo) {

                await MainController.sleep(2000)
                this.createMessage(this.conn.config.welcome_message.text)
                this.conn.enteredUsers[this.conn.enteredUsers.length] = { user_id: this.user_id, date: this.date }

            }            

        }
        
        let splitText = this.text.split(' '),
            index: number = -1

        if ((index = this.searchCom(splitText, '!admin')) == 0)
            await this.admin(splitText[index+1] as 'add' | 'remove' | 'list', Number(splitText[index+2]))
        
        if ([0, 1].indexOf(index = this.searchCom(splitText, '!stats')) > -1)
            await this.stats(Number(splitText[index+1]))

        if (await this.isAdmin()) {

            if ((index = this.searchCom(splitText, '!help')) == 0)
                await this.help()

            if ([0, 1].indexOf(index = this.searchCom(splitText, '!kick')) > -1)
                await this.kick(Number(splitText[index+1]))

            if ([0, 1].indexOf(index = this.searchCom(splitText, '!ban')) > -1) {

                let duration: number = 0

                if (this.data.to_id) {
                    if (Number(splitText[index+1]))
                        duration = Number(splitText[index+1])
                    
                    await this.ban(this.data.to_id, duration)
                }else {
                    if (Number(splitText[index+2]))
                        duration = Number(splitText[index+2])

                    await this.ban(Number(splitText[index+1]), duration)
                }
                
            }

            if ((index = this.searchCom(splitText, '!unban')) == 0)
                await this.unban(Number(splitText[index+1]))

        }

    }

    findEntered (user_id: number): EnteredUser | false {

        for (let i = 0; i < this.conn.enteredUsers.length; i++) {

            const user = this.conn.enteredUsers[i]

            if (user.user_id == user_id) {

                if (user.date > (this.date - this.conn.config.welcome_message.interval))
                    return user
                else
                    this.conn.enteredUsers.splice(i, 1)

                break

            }
            
        }

        return false

    }

    async stats (user_id?: number): Promise<void> {

        if(!user_id)
            user_id = this.data.to_id

        if (user_id) {

            const message = `
ID: ${user_id}; 
Сообщении: ${await this.countEvents(user_id, 'chat')}; 
Лайков: ${await this.countEvents(user_id, 'like')};
Дизлайков: ${await this.countEvents(user_id, 'dislike')};
Суперлайков: ${await this.countEvents(user_id, 'superlike')};
Песен: ${await this.countEvents(user_id, 'start_song')}
            `

            await this.createMessage(message)


        }

    }

    async countEvents (to_id: number, eventName: string): Promise<number> {

        return (await this.database.select('logs', [to_id, this.club_id, eventName] as string[], `WHERE user_id=? AND club_id=? AND type=?`)).length

    }

    searchCom (text: string[], name: string): number {

        for (let i = 0; i < text.length; i++)
            if (text[i] == name)
                return i

        return -1

    }

    async help (): Promise<void> {

        await this.createMessage('Список актуальных команд доступен в группе проекта')

    }

    async kick (user_id?: number): Promise<void> {

        if (!user_id)
            user_id = this.data.to_id

        if (user_id) {

            if (await this.isAdmin(user_id)) {

                await this.createMessage('Вы не можете исключать других администраторов!')

            }else {

                this.conn.send({ type: "club_ban", user_id: user_id })

            }
            
        }

    }

    async ban (user_id?: number, duration: number = 0): Promise<void> {

        if (user_id) {

            if (!(await this.isAdmin(user_id))) {

                if (!(await this.isBanned(user_id))) {

                    if (duration > 0)
                        duration = this.date + duration
        
                    let parms = [String(this.club_id), String(this.user_id), String(duration), String(this.date), String(user_id)]
        
                    await this.database.insert('blocks(club_id,admin_id,duration,date,user_id)', parms, '?,?,?,?,?')
        
                    this.conn.send({
                        type: "club_ban",
                        user_id: user_id
                    })

                    await this.createMessage(`Пользователь забанен на срок: ${(duration) ? (duration - this.date)+' секунд' : 'навсегда'}`)
        
                }else {
        
                    await this.createMessage('Данный пользователь уже забанен!')
        
                }

            }else {

                await this.createMessage('Вы не можете банить других администраторов!')

            }

        }

    }

    async unban (user_id: number): Promise<void> {

        await this.database.delete('blocks', [String(this.club_id), String(user_id)], 'WHERE club_id=? AND user_id=?')

        await this.createMessage('Пользователь успешно разблокирован! Блокировка в игре спадёт через сутки.')

    }

    async admin (command: 'add'|'remove'|'list', user_id?:number): Promise<void> {

        let message = ''

        if (await this.isAdmin(this.user_id)) {

            if (user_id) {

                if (await this.isAdmin(this.user_id, true)) {

                    if (command == 'add') {
        
                        if (!(await this.isAdmin(user_id))) {

                            await this.database.insert('admins(club_id,user_id,date)', [String(this.club_id), String(user_id), String(this.date)], '?,?,?')
                            message = 'Пользователь назначен администратором клуба'

                        }else {

                            message = 'Пользователь уже добавлен в администраторы!'

                        }
                        
            
                    }else if (command == 'remove') {
            
                        await this.database.delete('admins', [String(this.club_id), String(user_id)], `WHERE club_id=? AND user_id=? LIMIT 1`)
                        message = 'Пользователь удален из администрации клуба'
            
                    }
        
                }else {
        
                    message = 'У Вас нет доступа к этой команде!'
        
                }

            }else {

                message = 'Не указан параметр user_id!'

            }

        }
        

        if (command == 'list') {

            const res = await this.database.select('admins', [String(this.club_id)], 'WHERE club_id=?')
            
            let adminsArr = []

            while (adminsArr.length < res.length) {

                adminsArr[adminsArr.length] = "id" + res[adminsArr.length].user_id

            }

            message = 'Администраторы клуба: ' + adminsArr.join(', ')

        }

        if (message)
            await this.createMessage(message)

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