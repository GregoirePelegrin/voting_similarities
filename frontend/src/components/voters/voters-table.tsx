import React from "react";
import {useNavigate} from "react-router-dom";
import {DataGrid, GridColDef, GridToolbarContainer, GridToolbarQuickFilter} from "@mui/x-data-grid";
import {Box} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../../stores/root-store";
import {VOTERS_TABLE} from "../../constants/fr";

function SearchToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarQuickFilter />
    </GridToolbarContainer>
  );
}

  const columns: GridColDef[] = [
    {field: "firstname", headerName: VOTERS_TABLE.FIRST_NAME, flex: 1},
    {field: "lastname", headerName: VOTERS_TABLE.LAST_NAME, flex: 1},
    {field: "group_name_short", headerName: VOTERS_TABLE.GROUP, flex: 1},
    {field: "role", headerName: VOTERS_TABLE.ROLE, width: 130},
    {field: "commission", headerName: VOTERS_TABLE.COMMISSION, width: 140},
    {field: "circonscription", headerName: VOTERS_TABLE.CIRCONSCRIPTION, width: 160},
  ];

const VotersTable: React.FC = observer(() => {
  const {votersStore, uiStore} = rootStore;
  const navigate = useNavigate();

  const rows = votersStore.voters.map((p) => ({
    id: p.id,
    firstname: p.firstname,
    lastname: p.lastname,
    group_name_short: p.group_name_short || p.group_name,
    group_color: p.group_color,
    role: p.role,
    commission: p.commission,
    circonscription: p.circonscription,
  }));

  return (
    <Box sx={{height: "calc(100vh - 160px)", width: "100%"}}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: {paginationModel: {page: 0, pageSize: 50}},
          sorting: {sortModel: [{field: "lastname", sort: "asc"}, {field: "firstname", sort: "asc"}]},
        }}
        slots={{toolbar: SearchToolbar}}
        onRowClick={(params) => navigate(`/voters/${params.id}`)}
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

export default VotersTable;
