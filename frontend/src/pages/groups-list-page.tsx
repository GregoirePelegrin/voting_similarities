import React, {useEffect} from "react";
import {Box} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import GroupsTable from "../components/groups/groups-table";
import MetricInfoCard from "../components/shared/metric-info-card";
import {CardSkeleton} from "../components/shared/loading-skeleton";
import {METRICS} from "../constants/fr";

const GroupsListPage: React.FC = observer(() => {
  const {groupsStore, uiStore} = rootStore;

  useEffect(() => {
    groupsStore.fetchGroups();
  }, [uiStore.retryVersion]);

  if (uiStore.loading && groupsStore.groups.length === 0) {
    return (
      <AnimatedPage>
        <CardSkeleton/>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <GroupsTable/>
      <Box sx={{mt: 3}}>
        <MetricInfoCard sections={[METRICS.GROUPS_LIST.COHESIVITY]}/>
      </Box>
    </AnimatedPage>
  );
});

export default GroupsListPage;
