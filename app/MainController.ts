import { Config } from "./Interface/MainController"
import * as fs from 'fs'
import { DB } from './DB'

export class MainController {

    config: Config
    db: DB

    constructor () {

        this.config = JSON.parse(fs.readFileSync('./config.json').toString())
        
        this.db = new DB(this.config.DataBase)

    }

    sleep(ms: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

}