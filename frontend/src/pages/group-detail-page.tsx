import React, {useEffect} from "react";
import {useParams} from "react-router-dom";
import {Box, Card, CardContent, Typography, Grid} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import CategoryFilter from "../components/shared/category-filter";
import CohesivityGauge from "../components/shared/cohesivity-gauge";
import SimilarGroupsList from "../components/groups/similar-groups-list";
import CategoryHeatmap from "../components/groups/category-heatmap";
import DeterminantCategoriesCard from "../components/groups/determinant-categories-card";
import {CardSkeleton} from "../components/shared/loading-skeleton";
import {GROUP_DETAIL} from "../constants/fr";

const GroupDetailPage: React.FC = observer(() => {
  const {id} = useParams<{ id: string }>();
  const {groups, ui} = rootStore;
  const groupId = Number(id);

  useEffect(() => {
    if (groupId) {
      ui.setCategory(null);
      groups.clearGroupDetail();
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId) {
      groups.fetchGroup(groupId, ui.selectedCategory);
    }
  }, [groupId, ui.selectedCategory]);

  useEffect(() => {
    if (groupId) {
      groups.fetchDeterminantCategories(groupId);
    }
  }, [groupId]);

  const group = groups.selectedGroup;

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
        <CategoryFilter/>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{bgcolor: "background.paper"}}>
            <CardContent sx={{display: "flex", flexDirection: "column", alignItems: "center", gap: 2}}>
              <CohesivityGauge value={group.cohesivity} color={group.color}/>
              <CohesivityGauge value={group.answer_rate} color={group.color} label={GROUP_DETAIL.ANSWER_RATE}/>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <SimilarGroupsList groups={group.similar_groups}/>
        </Grid>
        <Grid item xs={12}>
          <CategoryHeatmap similarGroups={groups.heatmapSimilarGroups} groupColor={group.color}/>
        </Grid>
        <Grid item xs={12}>
          <DeterminantCategoriesCard categories={groups.determinantCategories}/>
        </Grid>
      </Grid>
    </AnimatedPage>
  );
});

export default GroupDetailPage;
