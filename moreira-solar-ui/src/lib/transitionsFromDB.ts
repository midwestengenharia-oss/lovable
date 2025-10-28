// utils/transitionsFromDB.ts
import { LoadedBoard } from "@/hooks/useBoardConfigFromDB";

export function canMove(loaded: LoadedBoard, fromColId: string, toColId: string) {
    const allowTo = loaded.transitions[fromColId] || [];
    // se a matriz não define a linha, libera
    return allowTo.length === 0 ? true : allowTo.includes(toColId);
}
