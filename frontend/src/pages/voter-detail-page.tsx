import React, {useEffect} from "react";
import {useParams} from "react-router-dom";
import {Box, Typography, Chip, Grid, Card, CardContent} from "@mui/material";
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
import {VOTER_DETAIL} from "../constants/fr";
import {DATA_COLORS} from "../theme";

const VoterDetailPage: React.FC = observer(() => {
  const {id} = useParams<{ id: string }>();
  const {votersStore, uiStore} = rootStore;
  const voterId = Number(id);

  useEffect(() => {
    if (voterId) {
      uiStore.setCategory(null);
      votersStore.clearVoterDetail();
    }
  }, [voterId]);

  useEffect(() => {
    if (voterId) {
      votersStore.fetchVoter(voterId, uiStore.selectedCategory);
    }
  }, [voterId, uiStore.selectedCategory, uiStore.retryVersion]);

  useEffect(() => {
    if (voterId) {
      votersStore.fetchCategoryAlignment(voterId);
    }
  }, [voterId, uiStore.retryVersion]);

  const voter = votersStore.selectedVoter;

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
        <CategoryFilter/>
      </Box>

      <Box sx={{display: "flex", gap: 3, mb: 3}}>
        <Box sx={{flex: 1, minWidth: 0}}>
          <VoterInfoCard
            role={voter.role}
            commission={voter.commission}
            circonscription={voter.circonscription}
          />
        </Box>
        <Card>
          <CardContent sx={{display: "flex", gap: 3, alignItems: "center"}}>
            <CohesivityGauge value={voter.answer_rate} color={voter.group.color} size={90}
                             label={VOTER_DETAIL.ANSWER_RATE}/>
            <CohesivityGauge value={voter.group_avg_answer_rate} color={voter.group.color} size={90}
                             label={VOTER_DETAIL.GROUP_AVG}/>
          </CardContent>
        </Card>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SimilarVotersCard
            title={VOTER_DETAIL.MOST_SIMILAR}
            voters={voter.similar_voters}
            color={DATA_COLORS.primary}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <SimilarVotersCard
            title={VOTER_DETAIL.LEAST_SIMILAR}
            voters={voter.dissimilar_voters}
            color={DATA_COLORS.negative}
            showSign
          />
        </Grid>
        <Grid item xs={12}>
          <GroupComparisonBars comparisons={voter.group_comparisons}/>
        </Grid>
        <Grid item xs={12}>
          <CategoryAlignmentCard alignments={votersStore.categoryAlignment}/>
        </Grid>
        <Grid item xs={12}>
          <AnswerGrid answers={voter.answers}/>
        </Grid>
      </Grid>
    </AnimatedPage>
  );
});

export default VoterDetailPage;
