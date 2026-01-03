import { AgGridReact } from 'ag-grid-react';
import React, { useMemo, useState, StrictMode, useRef, useEffect, useCallback } from "react";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ModuleRegistry, AllCommunityModule, themeMaterial } from 'ag-grid-community';
import { RowGroupingModule } from 'ag-grid-enterprise';
ModuleRegistry.registerModules([AllCommunityModule, RowGroupingModule]);


const columns = ([
    { field: 'rank' },
    { field: 'id' },
    { field: 'name' },
    { field: 'tag', rowGroup: true, hide: true },
    { field: 'villages' },
    { field: 'points' },
    { field: 'iswinner' },
    { field: 'willdelete' },
    { field: 'willmaybe' }

]);


export async function loadAllyData() {
    const allyurl = 'https://corsproxy.io/?https://de242.die-staemme.de/map/ally.txt';
    const allyresponse = await fetch(allyurl);
    const allytext = await allyresponse.text();
    // Plus-Zeichen durch Leerzeichen ersetzen
    const allydecodedText = allytext.replace(/\+/g, ' ');
    const finalAllyText = decodeURIComponent(allydecodedText);

    const playerurl = 'https://corsproxy.io/?https://de242.die-staemme.de/map/player.txt';
    const playerresponse = await fetch(playerurl);
    const playertext = await playerresponse.text();
    const playerdecodedText = playertext.replace(/\+/g, ' ');
    const finalPlayerText = decodeURIComponent(playerdecodedText);

    // Zeilen trennen
    const allylines = finalAllyText.trim().split('\n');
    const playerlines = finalPlayerText.trim().split('\n');

    // In Tabellen-Objekte umwandeln
    const allyrows = allylines.map(allyline => {
        const [
            id,
            name,
            tag,
            members,
            villages,
            points,
            all_points,
            rank
        ] = allyline.split(',');


        return {
            id: Number(id),
            name,
            tag,
            members: Number(members),
            villages: Number(villages),
            points: Number(points),
            all_points: Number(all_points),
            rank: Number(rank)
        };
    });
    allyrows.sort((a, b) => a.rank - b.rank);


    const playerrows = playerlines.map(playerline => {
        const [
            id,
            name,
            ally_id,
            villages,
            points,
            rank,
            iswinner,
            willdelete,
            willmaybe
        ] = playerline.split(',');


        return {
            id: Number(id),
            name: String(name),
            ally_id: Number(ally_id),
            villages: Number(villages),
            points: Number(points),
            rank: Number(rank),
            iswinner: Boolean(iswinner),
            willdelete: Boolean(willdelete),
            willmaybe: Boolean(willmaybe),
        };
    });
    playerrows.sort((a, b) => a.rank - b.rank);
    //return playerrows;

    const allianceMap = Object.fromEntries(
        allyrows.map(a => [a.id, a])
    );

    const leftJoined = playerrows.map(player => {
        const alliance = allianceMap[player.ally_id] || {};

        return {

            ...player,

            // Allianzfelder (explizit, damit sie immer existieren)
            alliance_id: alliance.id ?? 0,
            alliance_name: alliance.name ?? "N/A",
            tag: alliance.tag ?? "N/A",
            members: alliance.members ?? "N/A",


        };
    });

    console.log("leftJoined:", leftJoined);

    return leftJoined;
}


const rows = await loadAllyData();

async function getNumberVillagesTotal() {
    const data = rows;
    const sumVillages = data.reduce((sum, player) => {
        return sum + player.villages;
    }, 0);
    console.log(sumVillages);
    return sumVillages;
}



export default function DataTable() {

    const [rowData, setRowData] = useState([]);
    const [sumVillagesWinner, setSumVillagesWinner] = useState(0);
    const [sumVillagesSave, setSumVillagesSave] = useState(0);
    const [sumVillagesMaybe, setSumVillagesMaybe] = useState(0);
    

    useEffect(() => {
        async function calculateSumVillagesWinner() {
            const sum = rowData.reduce((sum, player) => player.iswinner ? sum + player.villages : sum, 0);
            setSumVillagesWinner(sum);
        }
        calculateSumVillagesWinner();
    }, [rowData]);

    useEffect(() => {
        async function calculateSumVillagesSave() {
            const sum = rowData.reduce((sum, player) => player.willdelete ? sum + player.villages : sum, 0);
            setSumVillagesSave(sum);
        }
        calculateSumVillagesSave();
    }, [rowData]);

    useEffect(() => {
        async function calculateSumVillagesMaybe() {
            const sum = rowData.reduce((sum, player) => player.willmaybe ? sum + player.villages : sum, 0);
            setSumVillagesMaybe(sum);
        }
        calculateSumVillagesMaybe();
    }, [rowData]);

    useEffect(() => {
        async function loadData() {
            const data = await loadAllyData(); // ⬅️ deine Funktion
            setRowData(data);                  // ⬅️ HIER passiert es
        }

        loadData();
    }, []);




    const [sum, setSum] = useState(0);
    const gridRef = useRef();
    const onSelectionChanged = () => {

        const selectedRows = gridRef.current.api.getSelectedRows();

        const total = selectedRows.reduce(
            (sum, row) => sum + row.villages,
            0
        );

        setSum(total);
    };

    const rowSelection = useMemo(() => {
        return {
            mode: 'multiRow',
            groupSelects: 'descendants',
            checkboxLocation: 'autoGroupColumn'
        };
    }, []);


    const containerStyle = useMemo(() => ({ width: "100%", height: "100%" }), []);
    const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);

    const winner = () => {
        const selectedNodes = gridRef.current.api.getSelectedNodes();

        if (selectedNodes.length === 0) {
            alert('Bitte eine Zeile auswählen');
            return;
        }

        const idsToDelete = selectedNodes.map(n => n.data.id);

        setRowData(prev =>
            prev.map(row =>
                idsToDelete.includes(row.id)
                    ? { ...row, iswinner: true }
                    : row
            )
        );



    };

    const notwinner = () => {
        const selectedNodes = gridRef.current.api.getSelectedNodes();

        if (selectedNodes.length === 0) {
            alert('Bitte eine Zeile auswählen');
            return;
        }

        const idsToDelete = selectedNodes.map(n => n.data.id);

        setRowData(prev =>
            prev.map(row =>
                idsToDelete.includes(row.id)
                    ? { ...row, iswinner: false }
                    : row
            )
        );



    };

    const willDelte = () => {
        const selectedNodes = gridRef.current.api.getSelectedNodes();

        if (selectedNodes.length === 0) {
            alert('Bitte eine Zeile auswählen');
            return;
        }

        const idsToDelete = selectedNodes.map(n => n.data.id);

        setRowData(prev =>
            prev.map(row =>
                idsToDelete.includes(row.id)
                    ? { ...row, willdelete: true }
                    : row
            )
        );



    };
    const willnotDelte = () => {
        const selectedNodes = gridRef.current.api.getSelectedNodes();

        if (selectedNodes.length === 0) {
            alert('Bitte eine Zeile auswählen');
            return;
        }

        const idsToDelete = selectedNodes.map(n => n.data.id);

        setRowData(prev =>
            prev.map(row =>
                idsToDelete.includes(row.id)
                    ? { ...row, willdelete: false }
                    : row
            )
        );



    };

    const maybe = () => {
        const selectedNodes = gridRef.current.api.getSelectedNodes();

        if (selectedNodes.length === 0) {
            alert('Bitte eine Zeile auswählen');
            return;
        }

        const idsToDelete = selectedNodes.map(n => n.data.id);

        setRowData(prev =>
            prev.map(row =>
                idsToDelete.includes(row.id)
                    ? { ...row, willmaybe: true }
                    : row
            )
        );



    };

    const notmaybe = () => {
        const selectedNodes = gridRef.current.api.getSelectedNodes();

        if (selectedNodes.length === 0) {
            alert('Bitte eine Zeile auswählen');
            return;
        }

        const idsToDelete = selectedNodes.map(n => n.data.id);

        setRowData(prev =>
            prev.map(row =>
                idsToDelete.includes(row.id)
                    ? { ...row, willmaybe: false }
                    : row
            )
        );



    };

    const [villageCounttotal, setVillageCountTotal] = useState(0);

    useEffect(() => {
        async function loadVillageCountTotal() {
            const number = await getNumberVillagesTotal();
            setVillageCountTotal(number);
        }

        loadVillageCountTotal();
    }, []);





    return (

        <div style={containerStyle}>
            <div style={gridStyle}>
                <div className='ag-theme-alpine' style={{ height: 600, width: '100%' }}>
                    <AgGridReact
                        ref={gridRef}
                        theme={themeMaterial}
                        rowData={rowData}
                        columnDefs={columns}
                        rowSelection={rowSelection}
                        pagination={true}
                        paginationPageSize={50}
                        onSelectionChanged={onSelectionChanged}
                        getRowId={(params) => params.data.id}


                    />
                </div>
            </div>
            {/* Label */}
            <div style={{ marginTop: 10 }}>
                <strong>Summe der selektierten Preise:</strong> {sum}
            </div>

            <div>
                <div>
                    <h1>Aktueller Stand</h1>
                    <p>
                        <label>Alle Dörfer: <strong>{villageCounttotal.toLocaleString()}</strong></label>

                    </p>
                    <p>
                        <label>Siegerdörfer: <strong>{sumVillagesWinner}</strong></label>
                        <label style={{ marginLeft: 10 }}>(x%)  </label>
                    </p>


                    <label>
                        Safe Löschen Dörfer: <strong>{sumVillagesSave}</strong>
                    </label>
                    <br />
                    <label>
                        Vielleicht Löschen Dörfer: <strong>{sumVillagesMaybe}</strong>
                    </label>

                </div>
                <div>
                    <button onClick={winner}>Als Sieger Festlegen</button>
                    <button onClick={willDelte}>Als Save Löschen Festlegen</button>
                    <button onClick={maybe}>löscht vielleicht</button>
                </div>
                <div>
                    <button onClick={notwinner}>Siegerplatz aberkennen</button>
                    <button onClick={willnotDelte}>Save löschen entfernen</button>
                    <button onClick={notmaybe}>vielleicht entfernen</button>
                </div>
            </div>
        </div>

    );
}

