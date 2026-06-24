import React, { useEffect } from "react";
import { Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import CategoryFilter from "../components/shared/category-filter";
import PeopleScatter from "../components/map/people-scatter";
import GroupsScatter from "../components/map/groups-scatter";
import MethodologyPanel from "../components/map/methodology-panel";

const MapPage: React.FC = observer(() => {
  const { embeddings, ui } = rootStore;

  useEffect(() => {
    embeddings.fetchPeopleEmbedding(ui.selectedCategory);
    embeddings.fetchGroupsEmbedding(ui.selectedCategory);
  }, [ui.selectedCategory]);

  return (
    <AnimatedPage>
      <Box sx={{ mb: 2 }}>
        <CategoryFilter />
      </Box>
      <MethodologyPanel />
      {embeddings.peopleEmbedding && (
        <PeopleScatter
          points={embeddings.peopleEmbedding.points}
          barycenters={embeddings.peopleEmbedding.barycenters}
          stress={embeddings.peopleEmbedding.stress}
        />
      )}
      <Box sx={{ mt: 3 }} />
      {embeddings.groupsEmbedding && (
        <GroupsScatter
          points={embeddings.groupsEmbedding.points}
          stress={embeddings.groupsEmbedding.stress}
        />
      )}
    </AnimatedPage>
  );
});

export default MapPage;
