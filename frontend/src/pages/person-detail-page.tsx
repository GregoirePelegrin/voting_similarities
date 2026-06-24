import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Chip, Grid } from "@mui/material";
import { observer } from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import CategoryFilter from "../components/shared/category-filter";
import SimilarPeopleCard from "../components/people/similar-people-card";
import AnswerGrid from "../components/people/answer-grid";
import GroupComparisonBars from "../components/people/group-comparison-bars";
import CategoryAlignmentCard from "../components/people/category-alignment-card";
import { CardSkeleton } from "../components/shared/loading-skeleton";

const PersonDetailPage: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const { people, ui } = rootStore;
  const personId = Number(id);

  useEffect(() => {
    if (personId) {
      people.fetchPerson(personId, ui.selectedCategory);
    }
  }, [personId, ui.selectedCategory]);

  useEffect(() => {
    if (personId) {
      people.fetchCategoryAlignment(personId);
    }
  }, [personId]);

  const person = people.selectedPerson;

  if (!person) {
    return (
      <AnimatedPage>
        <CardSkeleton />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Typography variant="h4">{person.name}</Typography>
          <Chip
            label={person.group.name}
            size="small"
            sx={{ bgcolor: person.group.color + "30", color: person.group.color, borderColor: person.group.color + "60" }}
            variant="outlined"
          />
          <Typography variant="body2" color="text.secondary">
            {person.group.member_count} members
          </Typography>
        </Box>
        <CategoryFilter />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <AnswerGrid answers={person.answers} />
        </Grid>
        <Grid item xs={12} md={6}>
          <SimilarPeopleCard
            title="Most Similar"
            people={person.similar_people}
            color="#4A90D9"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <SimilarPeopleCard
            title="Least Similar"
            people={person.dissimilar_people}
            color="#E15759"
          />
        </Grid>
        <Grid item xs={12}>
          <GroupComparisonBars comparisons={person.group_comparisons} />
        </Grid>
        <Grid item xs={12}>
          <CategoryAlignmentCard alignments={people.categoryAlignment} />
        </Grid>
      </Grid>
    </AnimatedPage>
  );
});

export default PersonDetailPage;
