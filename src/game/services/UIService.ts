import { GameUIAdapter } from "../ui/GameUIAdapter";

export class UIService {
    public readonly ui: GameUIAdapter;

    constructor(uiad: GameUIAdapter) {
        this.ui = uiad;
    }
}