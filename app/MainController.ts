import { Config } from "./Interface/MainController"
import * as fs from 'fs'

export class MainController {

    config: Config

    constructor () {
        global.config = JSON.parse(fs.readFileSync('./config.json').toString())
    }

    static sleep(ms: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

}