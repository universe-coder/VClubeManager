import { Model } from "./Model";

export interface Log extends Model {
    id: number;
    club_id: number;
    user_id: number;
    type: string;
    text: string;
    date: number;
}