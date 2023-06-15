import * as mysql from 'mysql2'
import { MainController } from './MainController'


export abstract class DB {

    private host:     string
    private database: string
    private username: string
    private password: string
    private table: string

    constructor () {

        this.host = global.config.DataBase.host
        this.database = global.config.DataBase.dbname
        this.username = global.config.DataBase.username
        this.password = global.config.DataBase.password
        if (!this.table)
            this.table = this.constructor.name.toLowerCase() + "s"

    }

    async insert (parms: string[], condition: string = ''): Promise<void> {

        await this.query(`INSERT INTO ${this.table} VALUES (${condition})`, parms)

    }

    async select (parms: string[], condition: string = ''): Promise<mysql.RowDataPacket[] | mysql.RowDataPacket[][] | mysql.OkPacket[]> {

        return await this.query(`SELECT * FROM ${this.table} ${condition}`, parms) as mysql.RowDataPacket[]

    }

    async delete (parms: string[], condition: string = ''): Promise<void> {

        await this.query(`DELETE FROM ${this.table} ${condition}`, parms)

    }

    async update (parms: string[], condition: string = ''): Promise<void> {

        await this.query(`UPDATE ${this.table} ${condition}`, parms)

    }

    async query (str: string, parms: string[]): Promise<mysql.RowDataPacket[] | mysql.RowDataPacket[][] | mysql.OkPacket | mysql.OkPacket[] | mysql.ResultSetHeader> {

        return new Promise(async (resolve) => {

            try {
                const conn = mysql.createConnection({
                    host: this.host,
                    user: this.username,
                    database: this.database,
                    password: this.password
                  })
                conn.query(str, parms, (err, res) => resolve(res))
                conn.end()
            }catch (err) {
                console.log(err)
                await MainController.sleep(100)
                resolve(await this.query(str, parms))
            }
            
        })

    }

}
