export interface Config {

    DataBase: {
        host: string,
        dbname: string,
        username: string,
        password: string
    };
    host: {
        club_id: number,
        user_id: number,
        token: string,
        system_id: string
    };
    super_admin: number;
    welcome_message: {
        enable: boolean,
        text: string,
        interval: number
    };
    limits: {
        messages: {
            count: number,
            time: number
        },
        user_messages: {
            count: number,
            time: number
        },
        enter: {
            count: number,
            time: number
        },
        likes: {
            count: number,
            time: number
        },
        dislikes: {
            count: number,
            time: number
        },
        superlikes: {
            count: number,
            time: number
        }
    };
    
}