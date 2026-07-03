import React, {useEffect} from "react";
import {Box} from "@mui/material";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import {observer} from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import MetricInfoCard from "../components/shared/metric-info-card";
import {CardSkeleton} from "../components/shared/loading-skeleton";
import {CATEGORIES_TABLE, METRICS} from "../constants/fr";

const columns: GridColDef[] = [
  {field: "name", headerName: CATEGORIES_TABLE.NAME, flex: 1},
  {
    field: "infoGain",
    headerName: CATEGORIES_TABLE.INFO_GAIN,
    width: 180,
    valueFormatter: (v: number) => `${(v * 100).toFixed(1)}%`,
  },
  {
    field: "variance",
    headerName: CATEGORIES_TABLE.VARIANCE,
    width: 120,
    valueFormatter: (v: number) => v.toFixed(4),
  },
];

const CategoriesListPage: React.FC = observer(() => {
  const {categoriesStore, uiStore} = rootStore;

  useEffect(() => {
    categoriesStore.fetchDiscriminativeness();
  }, [uiStore.retryVersion]);

  const rows = categoriesStore.discriminativeness.map((d) => ({
    id: d.category_id,
    name: d.category_name,
    infoGain: d.normalized_ig,
    variance: d.variance_score,
  }));

  if (uiStore.loading && rows.length === 0) {
    return (
      <AnimatedPage>
        <CardSkeleton/>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <Box sx={{height: "calc(100vh - 160px)", width: "100%"}}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          initialState={{
            pagination: {paginationModel: {page: 0, pageSize: 50}},
            sorting: {sortModel: [{field: "name", sort: "asc"}]},
          }}
          sx={{
            bgcolor: "background.paper",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
          loading={uiStore.loading}
        />
      </Box>
      <Box sx={{mt: 3}}>
        <MetricInfoCard sections={[METRICS.CATEGORIES_LIST.INFO_GAIN]}/>
      </Box>
    </AnimatedPage>
  );
});

export default CategoriesListPage;