import React from "react";
import {useNavigate} from "react-router-dom";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import {Box, Chip} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../../stores/root-store";
import {QUESTIONS_TABLE} from "../../constants/fr";
import {DATA_COLORS} from "../../theme";

const columns: GridColDef[] = [
  {field: "id", headerName: QUESTIONS_TABLE.ID, width: 80},
  {field: "text", headerName: QUESTIONS_TABLE.QUESTION, flex: 2},
  {
    field: "has_passed",
    headerName: QUESTIONS_TABLE.PASSED,
    width: 110,
    renderCell: (params) => (
      <Chip
        label={params.value ? QUESTIONS_TABLE.PASSED : QUESTIONS_TABLE.NOT_PASSED}
        size="small"
        sx={{
          bgcolor: params.value ? "rgba(89,161,79,0.2)" : "rgba(225,87,89,0.2)",
          color: params.value ? DATA_COLORS.positive : DATA_COLORS.negative,
          fontSize: 11,
          height: 24,
        }}
      />
    ),
  },
  {
    field: "categories",
    headerName: QUESTIONS_TABLE.CATEGORIES,
    flex: 1,
    renderCell: (params) => (
      <Box sx={{display: "flex", gap: 0.5, flexWrap: "wrap"}}>
        {(params.value as string[]).map((c: string) => (
          <Chip key={c} label={c} size="small" variant="outlined" sx={{fontSize: 10, height: 20}}/>
        ))}
      </Box>
    ),
  },
];

const QuestionsTable: React.FC = observer(() => {
  const {questions, categories, ui} = rootStore;
  const navigate = useNavigate();

  const catMap = new Map(categories.categories.map((c) => [c.id, c.name]));

  const rows = questions.questions.map((q) => ({
    id: q.id,
    text: q.text,
    has_passed: q.has_passed,
    categories: q.category_ids.map((cid) => catMap.get(cid) ?? `Cat ${cid}`),
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
        onRowClick={(params) => navigate(`/questions/${params.id}`)}
        sx={{
          cursor: "pointer",
          "& .MuiDataGrid-row:hover": {bgcolor: "rgba(74,144,217,0.08)"},
          bgcolor: "background.paper",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
        loading={ui.loading}
      />
    </Box>
  );
});

export default QuestionsTable;
