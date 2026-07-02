import React, {useEffect} from "react";
import {useParams} from "react-router-dom";
import {Box, Card, CardContent, Typography, Grid, ToggleButtonGroup, ToggleButton} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import CategoryFilter from "../components/shared/category-filter";
import CohesivityGauge from "../components/shared/cohesivity-gauge";
import SimilarGroupsList from "../components/groups/similar-groups-list";
import CategoryHeatmap from "../components/groups/category-heatmap";
import DeterminantCategoriesCard from "../components/groups/determinant-categories-card";
import {CardSkeleton} from "../components/shared/loading-skeleton";
import {GROUP_DETAIL, SORT} from "../constants/fr";

const GroupDetailPage: React.FC = observer(() => {
  const {id} = useParams<{ id: string }>();
  const {groupsStore, uiStore} = rootStore;
  const groupId = Number(id);

  useEffect(() => {
    if (groupId) {
      uiStore.setCategory(null);
      groupsStore.clearGroupDetail();
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId) {
      groupsStore.fetchGroup(groupId, uiStore.selectedCategory);
    }
  }, [groupId, uiStore.selectedCategory, uiStore.retryVersion]);

  useEffect(() => {
    if (groupId) {
      groupsStore.fetchDeterminantCategories(groupId);
    }
  }, [groupId, uiStore.retryVersion]);

  const group = groupsStore.selectedGroup;

  if (!group) {
    return (
      <AnimatedPage>
        <CardSkeleton/>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <Box sx={{mb: 3}}>
        <Box sx={{display: "flex", alignItems: "center", gap: 2, mb: 2}}>
          <Box sx={{width: 16, height: 16, borderRadius: "50%", bgcolor: group.color}}/>
          <Typography variant="h4">{group.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {group.member_count} {GROUP_DETAIL.MEMBERS}
          </Typography>
        </Box>
        <Box sx={{display: "flex", alignItems: "center", gap: 2}}>
          <CategoryFilter/>
          <ToggleButtonGroup
            size="small"
            value={uiStore.sortMode}
            exclusive
            onChange={(_, v) => v && uiStore.setSortMode(v)}
          >
            <ToggleButton value="value">{SORT.BY_VALUE}</ToggleButton>
            <ToggleButton value="name">{SORT.BY_NAME}</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{xs: 12, md: 4}}>
          <Card>
            <CardContent sx={{display: "flex", flexDirection: "column", alignItems: "center", gap: 2}}>
              <CohesivityGauge value={group.cohesivity} color={group.color}/>
              <CohesivityGauge value={group.answer_rate} color={group.color} label={GROUP_DETAIL.ANSWER_RATE}/>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs: 12, md: 8}}>
          <SimilarGroupsList groups={group.similar_groups} sortMode={uiStore.sortMode}/>
        </Grid>
        <Grid size={{xs: 12}}>
          <CategoryHeatmap similarGroups={groupsStore.heatmapSimilarGroups} groupColor={group.color}/>
        </Grid>
        <Grid size={{xs: 12}}>
          <DeterminantCategoriesCard categories={groupsStore.determinantCategories} groupColor={group.color} sortMode={uiStore.sortMode}/>
        </Grid>
      </Grid>
    </AnimatedPage>
  );
});

export default GroupDetailPage;
