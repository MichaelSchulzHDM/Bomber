import { AgGridReact } from 'ag-grid-react';
import React, { useMemo, useState, useRef, useEffect } from "react";
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-material.css';
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import NativeSelect from '@mui/material/NativeSelect';
import { useTheme } from '@mui/material/styles';
import { RowGroupingModule } from 'ag-grid-enterprise';
import { Select, MenuItem } from "@mui/material";
import {
    AllCommunityModule,
    ModuleRegistry,
    colorSchemeDarkBlue,
    themeQuartz,
} from "ag-grid-community";
import './App.css';

ModuleRegistry.registerModules([AllCommunityModule, RowGroupingModule]);

async function loadAllyData(world) {

    const allyurl = 'https://corsproxy.io/?https://' + world + '.die-staemme.de/map/ally.txt';
    const allyresponse = await fetch(allyurl);
    const allytext = await allyresponse.text();
    // Plus-Zeichen durch Leerzeichen ersetzen
    const allydecodedText = allytext.replace(/\+/g, ' ');
    const finalAllyText = decodeURIComponent(allydecodedText);

    const playerurl = 'https://corsproxy.io/?https://' + world + '.die-staemme.de/map/player.txt';
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
            eins
        ] = playerline.split(',');


        return {
            id: Number(id),
            name: String(name),
            ally_id: Number(ally_id),
            villages: Number(villages),
            points: Number(points),
            rank: Number(rank),
            iswinner: false,
            willdelete: false,
            willmaybe: false,
            eins: Boolean(eins)
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
            alliance_rank: alliance.rank ?? 0,
            alliance_name: alliance.name ?? "N/A",
            tag: alliance.tag ?? "N/A",
            members: alliance.members ?? "N/A",


        };
    });
    leftJoined.sort((a, b) => a.alliance_rank - b.alliance_rank);
    console.log("leftJoined:", leftJoined);

    return leftJoined;
}

async function getFullServerList() {
    const serverListUrl = 'https://corsproxy.io/?https://www.die-staemme.de/backend/get_servers.php';

    const response = await fetch(serverListUrl);
    const text = await response.text();

    // Array erzeugen
    return [...text.matchAll(/"(de\d+)"/g)].map(m => m[1]);
}


function DataTable() {

    const [servers, setServers] = React.useState([]);
    const [server, setServer] = React.useState("de250");

    let [rowData, setRowData] = React.useState([]);

    useEffect(() => {
        setRowData([]); // Leere Daten setzen, um vorherige Daten zu entfernen
        async function loadData() {
            const data = await loadAllyData(server);
            setRowData(data);
        }

        loadData();
    }, [server]);

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
            const sum = rowData.reduce((sum, player) => player.iswinner === true || player.willdelete ? sum + player.villages : sum, 0);
            setSumVillagesSave(sum);
        }
        calculateSumVillagesSave();
    }, [rowData]);

    useEffect(() => {
        async function calculateSumVillagesMaybe() {
            const sum = rowData.reduce((sum, player) => player.iswinner === true || player.willdelete === true || player.willmaybe === true ? sum + player.villages : sum, 0);
            setSumVillagesMaybe(sum);
        }
        calculateSumVillagesMaybe();
    }, [rowData]);

    const [percentVillagesWinner, setPercentVillagesWinner] = useState(0);
    const [percentVillagesSave, setPercentVillagesSave] = useState(0);
    const [percentVillagesMaybe, setPercentVillagesMaybe] = useState(0);

    useEffect(() => {
        async function calculatePercentVillagesWinner() {
            const sum = rowData.reduce((sum, player) => player.iswinner ? sum + player.villages : sum, 0);
            const all = rowData.reduce((all, player) => all + player.villages, 0);
            const percentValue = all === 0 ? 0 : ((sum / all) * 100).toFixed(2);
            setPercentVillagesWinner(percentValue);
        }
        calculatePercentVillagesWinner();
    }, [rowData]);

    useEffect(() => {
        async function calculatePercentVillagesSave() {
            const sum = rowData.reduce((sum, player) => player.iswinner === true || player.willdelete ? sum + player.villages : sum, 0);
            const all = rowData.reduce((all, player) => all + player.villages, 0);
            const percentValue = all === 0 ? 0 : ((sum / all) * 100).toFixed(2);
            setPercentVillagesSave(percentValue);
        }
        calculatePercentVillagesSave();
    }, [rowData]);

    useEffect(() => {
        async function calculatePercentVillagesMaybe() {
            const sum = rowData.reduce((sum, player) => player.iswinner === true || player.willdelete === true || player.willmaybe === true ? sum + player.villages : sum, 0);
            const all = rowData.reduce((all, player) => all + player.villages, 0);
            const percentValue = all === 0 ? 0 : ((sum / all) * 100).toFixed(2);
            setPercentVillagesMaybe(percentValue);
        }
        calculatePercentVillagesMaybe();
    }, [rowData]);

    const gridRef = useRef();


    const rowSelection = useMemo(() => {
        return {
            mode: 'multiRow',
            groupSelects: 'descendants',
            checkboxLocation: 'autoGroupColumn',
            enableSelectionWithoutKeys: true,
            enableClickSelection: true,
        };
    }, []);

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
    });

    async function getNumberVillagesTotal() {
        const data = rowData;
        const sumVillages = data.reduce((sum, player) => {
            return sum + player.villages;
        }, 0);
        console.log(sumVillages);
        return sumVillages;
    }

    const setWinner = (p) => {
        // 🔒 Guard – WICHTIG
        if (!p.data) return null;

        const handleClick = () => {
            const newValue = !p.data.iswinner;

            setRowData(prev =>
                prev.map(row =>
                    row.id === p.data.id
                        ? { ...row, iswinner: newValue }
                        : row
                )
            );
        };

        return (
            <button onClick={handleClick}>
                {p.data.iswinner ? "Siegerplatz" : "Kein Siegerplatz"}
            </button>
        );
    };

    const setMaybe = (p) => {
        // 🔒 Guard – WICHTIG
        if (!p.data) return null;

        const handleClick = () => {
            const newValue = !p.data.willmaybe;

            setRowData(prev =>
                prev.map(row =>
                    row.id === p.data.id
                        ? { ...row, willmaybe: newValue }
                        : row
                )
            );
        };

        return (
            <button onClick={handleClick}>
                {p.data.willmaybe ? "Vielleicht" : "Löscht nicht"}
            </button>
        );
    };

    const setDelte = (p) => {
        // 🔒 Guard – WICHTIG
        if (!p.data) return null;

        const handleClick = () => {
            const newValue = !p.data.willdelete;

            setRowData(prev =>
                prev.map(row =>
                    row.id === p.data.id
                        ? { ...row, willdelete: newValue }
                        : row
                )
            );
        };

        return (
            <button onClick={handleClick}>
                {p.data.willdelete ? "Löscht" : "Löscht nicht"}
            </button>
        );
    };


    const columns = useMemo(() => {
        return [
            { field: 'rank', width: 70 },
            { field: 'id', width: 110, hide: true },
            { field: 'name' },
            { field: 'tag', rowGroup: true, hide: true },
            { field: 'villages', width: 80 },
            { field: 'points' },
            { field: 'iswinner', hide: true },
            { field: 'willdelete', hide: true },
            { field: 'willmaybe', hide: true },
            {
                field: "winner",
                headerName: "Winner",
                cellRenderer: setWinner,
            },
            {
                field: "delete",
                headerName: "Delete",
                cellRenderer: setDelte,
            },
            {
                field: "Maybe",
                headerName: "Maybe",
                cellRenderer: setMaybe,
            }

        ]
    });


    const theme = useTheme();

    const isDark = theme.palette.mode === "dark";



    React.useEffect(() => {
        getFullServerList().then(setServers);
    }, []);

    return (
        <div className="tabelle-container">
            <box sx={{ display: "flex", justifyContent: "flex-end", marginBottom: 2 }}>
                
                <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
                    <InputLabel variant="standard" htmlFor="uncontrolled-native">Welt</InputLabel>
                    <Select value={server} onChange={(e) => setServer(e.target.value)}>
                        {servers.map(s => (
                            <MenuItem key={s} value={s}>
                                {s}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </box>
            <Box className="test" sx={{
                width: 1370, display: "flex", flexDirection: "column", gap: 3, '& .ag-theme-material': {
                    '--ag-background-color': isDark ? '#121212' : '#ffffff',
                    '--ag-row-background-color': isDark ? '#1e1e1e' : '#ffffff',
                    '--ag-header-background-color': isDark ? '#1e1e1e' : '#f5f5f5',
                    '--ag-foreground-color': isDark ? '#ffffff' : '#000000',
                    '--ag-border-color': isDark
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(0,0,0,0.12)',
                    '--ag-row-hover-color': isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.04)',
                },
            }}>
                {/* Grid */}
                <Box
                    key={theme.palette.mode}
                    className="ag-theme-material"
                    sx={{
                        height: 600, width: "100%",


                    }}
                >

                    <AgGridReact
                        ref={gridRef}
                        theme={theme}
                        rowData={rowData}
                        columnDefs={columns}
                        rowSelection={rowSelection}
                        pagination
                        paginationPageSize={50}
                        getRowId={(params) => params.data.id}
                    />
                </Box>





                <Stack spacing={1}>
                    

                    {/* Stats */}
                    <Stack spacing={0.5}>
                        <Typography>
                            Alle Dörfer: <strong>{villageCounttotal.toLocaleString()}</strong>
                        </Typography>

                        <Typography>
                            Siegerdörfer: <strong>{sumVillagesWinner}</strong>{" "}
                            ({percentVillagesWinner}%)
                        </Typography>

                        <Typography>
                            Mit Safe Löschen Dörfer: <strong>{sumVillagesSave}</strong>{" "}
                            ({percentVillagesSave}%)
                        </Typography>

                        <Typography>
                            Mit Vielleicht Löschen Dörfer: <strong>{sumVillagesMaybe}</strong>{" "}
                            ({percentVillagesMaybe}%)
                        </Typography>
                    </Stack>

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Button variant="contained" color="success" onClick={winner}>
                            Als Sieger festlegen
                        </Button>
                        <Button variant="contained" color="warning" onClick={willDelte}>
                            Als Safe löschen
                        </Button>
                        <Button variant="contained" color="info" onClick={maybe}>
                            Vielleicht löschen
                        </Button>
                    </Stack>

                    <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Button variant="outlined" color="success" onClick={notwinner}>
                            Sieger entfernen
                        </Button>
                        <Button variant="outlined" color="warning" onClick={willnotDelte}>
                            Safe löschen entfernen
                        </Button>
                        <Button variant="outlined" color="info" onClick={notmaybe}>
                            Vielleicht entfernen
                        </Button>
                    </Stack>
                </Stack>
            </Box>
        </div>



    );
}

export default DataTable;