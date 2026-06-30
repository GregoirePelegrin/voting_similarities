import React from "react";
import {useNavigate} from "react-router-dom";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import {Box} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../../stores/root-store";
import {PEOPLE_TABLE} from "../../constants/fr";

const columns: GridColDef[] = [
  {field: "id", headerName: PEOPLE_TABLE.ID, width: 80},
  {field: "firstname", headerName: PEOPLE_TABLE.FIRST_NAME, flex: 1},
  {field: "lastname", headerName: PEOPLE_TABLE.LAST_NAME, flex: 1},
  {field: "group_name", headerName: PEOPLE_TABLE.GROUP, flex: 1},
  {field: "role", headerName: PEOPLE_TABLE.ROLE, width: 130},
  {field: "commission", headerName: PEOPLE_TABLE.COMMISSION, width: 140},
  {field: "circonscription", headerName: PEOPLE_TABLE.CIRCONSCRIPTION, width: 160},
];

const PeopleTable: React.FC = observer(() => {
  const {peopleStore, uiStore} = rootStore;
  const navigate = useNavigate();

  const rows = peopleStore.people.map((p) => ({
    id: p.id,
    firstname: p.firstname,
    lastname: p.lastname,
    group_name: p.group_name,
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
        }}
        onRowClick={(params) => navigate(`/people/${params.id}`)}
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

export default PeopleTable;
