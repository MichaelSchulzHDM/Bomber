import { loadAllyData } from './TabelleAG-Grid'
import React, { useEffect, useMemo, useState, StrictMode } from "react";

async function getNumberVillages() {
    async function fetchData() {
        const data = await loadAllyData();
        return data

    }

    const data = await fetchData();

    const sumVillages = data.reduce((sum, player) => {
        return sum + player.villages;
    }, 0);
    console.log(sumVillages);
    return sumVillages;
}




export default function Calculation() {

    function SetWinner() { console.log("SetWinner clicked"); }
    function SetDelete() {
        console.log("SetDelete clicked");
    }
    function SetMaybeDelete() { console.log("SetMaybeDelete clicked"); }


    const [villageCount, setVillageCount] = useState(0);

    useEffect(() => {
        async function loadVillageCount() {
            const number = await getNumberVillages();
            setVillageCount(number);
        }

        loadVillageCount();
    }, []);

    return (
        <div>
            <div>
                <h1>Aktueller Stand</h1>
                <label>Alle Dörfer: </label>
                <label>Siegerdörfer</label>
                <label>
                    Alle Dörfer: <strong>{villageCount.toLocaleString()}</strong>
                </label>

            </div>
            <div>
                <button onClick={SetWinner}>Als Sieger Festlegen</button>
                <button onClick={SetDelete}>Als Save Löschen Festlegen</button>
                <button onClick={SetMaybeDelete}>Als Vielleich löschen Festlegen</button>
            </div>
        </div>
    );
}

