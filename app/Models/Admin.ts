import { DB } from "../DB"

export class Admin extends DB {

    id: number
    club_id: number
    user_id: number
    can_add: boolean
    date: number

}