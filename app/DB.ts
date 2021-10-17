import * as mysql from 'mysql2'
import { Config } from './Interface/MainController'

export class DB {

    private host:     string
    private database: string
    private username: string
    private password: string

    constructor (dbInfo: Config["DataBase"]) {

        this.host = dbInfo.host
        this.database = dbInfo.dbname
        this.username = dbInfo.username
        this.password = dbInfo.password

    }

    async insert (tableName: string, parms: string[], condition: string = ''): Promise<void> {

        await this.query(`INSERT INTO ${tableName} VALUES (${condition})`, parms)

    }

    async select (tableName: string, parms: string[], condition: string = ''): Promise<any> {

        return await this.query(`SELECT * FROM ${tableName} ${condition}`, parms)

    }

    async delete (tableName: string, parms: string[], condition: string = ''): Promise<void> {

        await this.query(`DELETE FROM ${tableName} ${condition}`, parms)

    }

    async update (tableName: string, parms: string[], condition: string = ''): Promise<void> {

        await this.query(`UPDATE ${tableName} ${condition}`, parms)

    }

    async query (str: string, parms: string[]): Promise<mysql.RowDataPacket[] | mysql.RowDataPacket[][] | mysql.OkPacket | mysql.OkPacket[] | mysql.ResultSetHeader> {

        let res: mysql.RowDataPacket[] | mysql.RowDataPacket[][] | mysql.OkPacket | mysql.OkPacket[] | mysql.ResultSetHeader

        return new Promise((resolve) => {

            const conn = mysql.createConnection({
                host: this.host,
                user: this.username,
                database: this.database,
                password: this.password
              })
            conn.query(str, parms, (err, res) => resolve(res))
            conn.end()

        })

    }

}