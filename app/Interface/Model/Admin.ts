import { Model } from "./Model";

export interface Admin extends Model {
    id: number;
    club_id: number;
    user_id: number;
    can_add: boolean;
    date: number;
}