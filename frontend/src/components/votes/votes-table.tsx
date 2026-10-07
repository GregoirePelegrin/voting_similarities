import React from "react";
import {useNavigate} from "react-router-dom";
import {DataGrid, GridColDef, gridStringOrNumberComparator} from "@mui/x-data-grid";
import {Box, Chip, Typography, useMediaQuery, useTheme} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../../stores/root-store";
import {VOTES_TABLE} from "../../constants/fr";
import {DATA_COLORS} from "../../theme";

const columns: GridColDef[] = [
  {
    field: "date",
    headerName: VOTES_TABLE.DATE,
    width: 140,
    sortingOrder: ["desc", "asc", null],
    getSortComparator: (sortDirection) => {
      const modifier = sortDirection === "desc" ? -1 : 1;
      return (value1, value2) => {
        if (value1 === null) return 1;
        if (value2 === null) return -1;
        return modifier * gridStringOrNumberComparator(value1, value2);
      };
    },
    renderCell: (params) =>
      params.value == null ? (
        <Typography variant="body2" sx={{color: "text.disabled"}}>
          {VOTES_TABLE.NO_DATE}
        </Typography>
      ) : (
        new Date(params.value as string).toLocaleDateString("fr-FR")
      ),
  },
  {field: "id", headerName: VOTES_TABLE.ID, width: 80},
  {field: "text", headerName: VOTES_TABLE.QUESTION, flex: 2},
  {
    field: "has_passed",
    headerName: VOTES_TABLE.PASSED,
    width: 110,
    renderCell: (params) => (
      <Chip
        label={params.value ? VOTES_TABLE.PASSED : VOTES_TABLE.NOT_PASSED}
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
    headerName: VOTES_TABLE.CATEGORIES,
    flex: 1,
    renderCell: (params) => (
      <Box sx={{display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap", height: "100%"}}>
        {(params.value as string[]).map((c: string) => (
          <Chip key={c} label={c} size="small" variant="outlined" sx={{fontSize: 10, height: 20}}/>
        ))}
      </Box>
    ),
  },
];

const VotesTable: React.FC = observer(() => {
  const {votesStore, categoriesStore, uiStore} = rootStore;
  const navigate = useNavigate();
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down("sm"));

  const catMap = new Map(categoriesStore.categories.map((c) => [c.id, c.name]));

  const rows = votesStore.votes.map((q) => ({
    id: q.id,
    date: q.date,
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
        columnVisibilityModel={isNarrow ? {id: false} : undefined}
        initialState={{
          pagination: {paginationModel: {page: 0, pageSize: 50}},
          sorting: {sortModel: [{field: "date", sort: "desc"}]},
        }}
        onRowClick={(params) => navigate(`/votes/${params.id}`)}
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

export default VotesTable;
