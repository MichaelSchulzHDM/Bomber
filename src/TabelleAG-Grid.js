import { AgGridReact } from 'ag-grid-react';
import React, { useMemo, useState, StrictMode, useRef  } from "react";
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
    { field: 'points' }

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
            rank
        ] = playerline.split(',');


        return {
            id: Number(id),
            name: String(name),
            ally_id: Number(ally_id),
            villages: Number(villages),
            points: Number(points),
            rank: Number(rank)
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

const percentwithdeleting = rows.filter(row => row.name.includes('[LÖSCHEN]')).length / rows.length * 100;





export default function DataTable() {
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

    return (

        <div style={containerStyle}>
            <div style={gridStyle}>
                <div className='ag-theme-alpine' style={{ height: 600, width: '100%' }}>
                    <AgGridReact
                        ref={gridRef}
                        theme={themeMaterial}
                        rowData={rows}
                        columnDefs={columns}
                        rowSelection={rowSelection}
                        pagination={true}
                        paginationPageSize={50}
                        onSelectionChanged={onSelectionChanged}


                    />
                </div>
            </div>
            {/* Label */}
            <div style={{ marginTop: 10 }}>
                <strong>Summe der selektierten Preise:</strong> {sum}
            </div>
        </div>

    );
}

