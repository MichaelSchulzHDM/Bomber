import { DataGrid } from '@mui/x-data-grid';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
    
import Paper from '@mui/material/Paper';

const columns = [
    { field: 'rank', headerName: 'Rank', width: 130 },
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 130 },
    { field: 'tag', headerName: 'Stamm', width: 130 },
    { field: 'villages', headerName: 'Villages', width: 130 },
    { field: 'points', headerName: 'Points', width: 130 }

];

async function loadAllyData() {
    const allyurl = 'https://corsproxy.io/?https://de242.die-staemme.de/map/ally.txt';
    const allyresponse = await fetch(allyurl);
    const allytext = await allyresponse.text();
    console.log(allytext);
    // Plus-Zeichen durch Leerzeichen ersetzen
    const allydecodedText = allytext.replace(/\+/g, ' ');
    const finalAllyText = decodeURIComponent(allydecodedText);

    const playerurl = 'https://corsproxy.io/?https://de242.die-staemme.de/map/player.txt';
    const playerresponse = await fetch(playerurl);
    const playertext = await playerresponse.text();
    console.log(playertext);
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


const paginationModel = { page: 0, pageSize: 50 };

export default function DataTable() {
    return (
        <Paper sx={{ height: 400, width: '100%' }}>
            <DataGrid
                rows={rows}
                columns={columns}
                initialState={{ pagination: { paginationModel } }}
                pageSizeOptions={[5, 50]}
                checkboxSelection
                sx={{ border: 0 }}
            />
        </Paper>
    );
}