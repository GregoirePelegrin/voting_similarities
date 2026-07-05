import React from "react";
import {useNavigate} from "react-router-dom";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import {Box, Typography,} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../../stores/root-store";
import {GROUPS_TABLE} from "../../constants/fr";

function pct(value: number | null | undefined): string {
  if (value == null) return "-";
  return `${(value * 100).toFixed(0)}%`;
}

const columns: GridColDef[] = [
  {
    field: "name",
    headerName: GROUPS_TABLE.NAME,
    minWidth: 200,
    flex: 1,
    renderCell: (params) => (
      <Box sx={{display: "flex", alignItems: "center", gap: 1, width: "100%", height: "100%"}}>
        <Box sx={{width: 12, height: 12, borderRadius: "50%", bgcolor: params.row.color}}/>
        <Typography variant="body2">{params.value}</Typography>
      </Box>
    ),
  },
  {
    field: "name_short",
    headerName: "Sigle",
    width: 100,
  },
  {field: "member_count", headerName: GROUPS_TABLE.MEMBERS, width: 100},
  {
    field: "cohesivity",
    headerName: GROUPS_TABLE.COHESIVITY,
    width: 100,
    renderCell: (params) => (
      <Box sx={{display: "flex", alignItems: "center", width: "100%", height: "100%"}}>
        <Typography variant="body2">{pct(params.value)}</Typography>
      </Box>
    ),
  },
  {
    field: "answer_rate",
    headerName: GROUPS_TABLE.ANSWER_RATE,
    width: 110,
    renderCell: (params) => (
      <Box sx={{display: "flex", alignItems: "center", width: "100%", height: "100%"}}>
        <Typography variant="body2">{pct(params.value)}</Typography>
      </Box>
    ),
  },
  {
    field: "presence_rate",
    headerName: GROUPS_TABLE.PRESENCE_RATE,
    width: 110,
    renderCell: (params) => (
      <Box sx={{display: "flex", alignItems: "center", width: "100%", height: "100%"}}>
        <Typography variant="body2">{pct(params.value)}</Typography>
      </Box>
    ),
  },
];

const GroupsTable: React.FC = observer(() => {
  const {groupsStore, uiStore} = rootStore;
  const navigate = useNavigate();

  const rows = groupsStore.groups.map((g) => ({
    id: g.id,
    name: g.name,
    name_short: g.name_short,
    color: g.color,
    member_count: g.member_count,
    cohesivity: g.cohesivity,
    answer_rate: g.answer_rate,
    presence_rate: g.presence_rate,
  }));

  return (
    <Box sx={{height: "calc(100vh - 160px)", width: "100%"}}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: {paginationModel: {page: 0, pageSize: 50}},
          sorting: {sortModel: [{field: "name", sort: "asc"}]},
        }}
        onRowClick={(params) => navigate(`/groups/${params.id}`)}
        sx={{
          cursor: "pointer",
          "& .MuiDataGrid-row:hover": {bgcolor: "rgba(74,144,217,0.08)"},
          bgcolor: "background.paper",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        loading={uiStore.loading}
      />
    </Box>
  );
});

export default GroupsTable;
