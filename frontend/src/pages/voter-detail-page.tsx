import React, {useEffect} from "react";
import {useParams} from "react-router-dom";
import {Box, Typography, Chip, Grid, Card, CardContent, ToggleButtonGroup, ToggleButton} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import CategoryFilter from "../components/shared/category-filter";
import SimilarVotersCard from "../components/voters/similar-voters-card";
import AnswerGrid from "../components/voters/answer-grid";
import GroupComparisonBars from "../components/voters/group-comparison-bars";
import CategoryAlignmentCard from "../components/voters/category-alignment-card";
import VoterInfoCard from "../components/voters/voter-info-card";
import CohesivityGauge from "../components/shared/cohesivity-gauge";
import {CardSkeleton} from "../components/shared/loading-skeleton";
import MetricInfoCard from "../components/shared/metric-info-card";
import {VOTER_DETAIL, SORT, METRICS} from "../constants/fr";
import {DATA_COLORS} from "../theme";

const VoterDetailPage: React.FC = observer(() => {
  const {id} = useParams<{ id: string }>();
  const {votersStore, uiStore, categoriesStore} = rootStore;
  const voterId = Number(id);

  useEffect(() => {
    if (voterId) {
      votersStore.clearVoterDetail();
    }
  }, [voterId]);

  useEffect(() => {
    if (voterId) {
      votersStore.fetchVoter(voterId, uiStore.selectedCategories);
    }
  }, [voterId, uiStore.categoriesKey, uiStore.retryVersion]);

  useEffect(() => {
    if (voterId) {
      votersStore.fetchCategoryAlignment(voterId);
    }
  }, [voterId, uiStore.retryVersion]);

  const voter = votersStore.selectedVoter;
  const categoriesLabel = (() => {
    const names = uiStore.selectedCategories
      .map(id => categoriesStore.categories.find(c => c.id === id)?.name)
      .filter((n): n is string => !!n);
    return names.length > 0 ? `Sur les questions ${names.join(" ET ")}` : undefined;
  })();

  if (!voter) {
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
          <Typography variant="h4">{voter.firstname} {voter.lastname}</Typography>
          <Chip
            label={voter.group.name}
            size="small"
            sx={{bgcolor: voter.group.color + "30", color: voter.group.color, borderColor: voter.group.color + "60"}}
            variant="outlined"
          />
          <Typography variant="body2" color="text.secondary">
            {voter.group.member_count} {VOTER_DETAIL.MEMBERS}
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

      <Card sx={{mb: 3}}>
        <CardContent sx={{display: "flex", gap: 3, alignItems: "center"}}>
          <Box sx={{flex: 1, minWidth: 0}}>
            <VoterInfoCard
              role={voter.role}
              commission={voter.commission}
              circonscription={voter.circonscription}
            />
          </Box>
          <Box sx={{display: "flex", gap: 2, alignItems: "center"}}>
            <CohesivityGauge value={voter.answer_rate} color={voter.group.color} size={80}
                             label={VOTER_DETAIL.ANSWER_RATE}/>
            <CohesivityGauge value={voter.presence_rate} color={voter.group.color} size={80}
                             label={VOTER_DETAIL.PRESENCE_RATE}/>
            <CohesivityGauge value={voter.group_avg_answer_rate} color={voter.group.color} size={80}
                             label={VOTER_DETAIL.GROUP_AVG}/>
            <CohesivityGauge value={voter.group_avg_presence_rate} color={voter.group.color} size={80}
                             label={VOTER_DETAIL.GROUP_AVG_PRESENCE}/>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid size={{xs: 12, md: 6}}>
          <SimilarVotersCard
            title={VOTER_DETAIL.MOST_SIMILAR}
            voters={voter.similar_voters}
            color={DATA_COLORS.primary}
            categoriesLabel={categoriesLabel}
          />
        </Grid>
        <Grid size={{xs: 12, md: 6}}>
          <SimilarVotersCard
            title={VOTER_DETAIL.LEAST_SIMILAR}
            voters={voter.dissimilar_voters}
            color={DATA_COLORS.negative}
            showSign
            categoriesLabel={categoriesLabel}
          />
        </Grid>
        <Grid size={{xs: 12}}>
          <GroupComparisonBars comparisons={voter.group_comparisons} sortMode={uiStore.sortMode} categoriesLabel={categoriesLabel}/>
        </Grid>
        <Grid size={{xs: 12}}>
          <CategoryAlignmentCard alignments={votersStore.categoryAlignment} sortMode={uiStore.sortMode}/>
        </Grid>
        <Grid size={{xs: 12}}>
          <AnswerGrid answers={voter.answers}/>
        </Grid>
      </Grid>
      <Box sx={{mt: 3}}>
        <MetricInfoCard
          sections={[
            METRICS.VOTER_DETAIL.GROUP_COMPARISON,
            METRICS.VOTER_DETAIL.CATEGORY_ALIGNMENT,
          ]}
        />
      </Box>
    </AnimatedPage>
  );
});

export default VoterDetailPage;
