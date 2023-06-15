import { DB } from "../DB";

export class Log extends DB {

    id: number
    club_id: number
    user_id: number
    type: string
    text: string
    date: number

}