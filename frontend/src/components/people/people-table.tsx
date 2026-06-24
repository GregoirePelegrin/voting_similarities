import React from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import rootStore from "../../stores/root-store";

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 80 },
  { field: "name", headerName: "Name", flex: 1 },
  { field: "group_id", headerName: "Group ID", width: 120 },
];

const PeopleTable: React.FC = observer(() => {
  const { people, ui } = rootStore;
  const navigate = useNavigate();

  const rows = people.people.map((p) => ({ id: p.id, name: p.name, group_id: p.group_id }));

  return (
    <Box sx={{ height: 600, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        paginationMode="server"
        rowCount={people.total}
        pageSizeOptions={[25, 50, 100]}
        paginationModel={{ page: people.page - 1, pageSize: people.pageSize }}
        onPaginationModelChange={(model: GridPaginationModel) => {
          people.fetchPeople(model.page + 1, people.groupId);
        }}
        onRowClick={(params) => navigate(`/people/${params.id}`)}
        sx={{
          cursor: "pointer",
          "& .MuiDataGrid-row:hover": { bgcolor: "rgba(74,144,217,0.08)" },
          bgcolor: "background.paper",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        loading={ui.loading}
      />
    </Box>
  );
});

export default PeopleTable;
