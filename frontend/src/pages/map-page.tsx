import React, {useEffect} from "react";
import {Box} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import {CardSkeleton} from "../components/shared/loading-skeleton";
import CategoryFilter from "../components/shared/category-filter";
import VotersScatter from "../components/map/voters-scatter";
import GroupsScatter from "../components/map/groups-scatter";
import MethodologyPanel from "../components/map/methodology-panel";

const MapPage: React.FC = observer(() => {
  const {embeddingsStore, uiStore} = rootStore;

  useEffect(() => {
    embeddingsStore.fetchVotersEmbedding(uiStore.selectedCategory);
    embeddingsStore.fetchGroupsEmbedding(uiStore.selectedCategory);
  }, [uiStore.selectedCategory, uiStore.retryVersion]);

  const isLoading = !embeddingsStore.votersEmbedding && !embeddingsStore.groupsEmbedding;

  return (
    <AnimatedPage>
      <Box sx={{mb: 2}}>
        <CategoryFilter/>
      </Box>
      <MethodologyPanel/>
      {isLoading ? (
        <CardSkeleton/>
      ) : (
        <>
          {
            embeddingsStore.votersEmbedding ? (
              <VotersScatter
                points={embeddingsStore.votersEmbedding.points}
                barycenters={embeddingsStore.votersEmbedding.barycenters}
                stress={embeddingsStore.votersEmbedding.stress}
              />
            ) : (
              <CardSkeleton/>
            )
          }
          <Box sx={{mt: 3}}/>
          {
            embeddingsStore.groupsEmbedding ? (
              <GroupsScatter
                points={embeddingsStore.groupsEmbedding.points}
                stress={embeddingsStore.groupsEmbedding.stress}
              />
            ) : (
              <CardSkeleton/>
            )
          }
        </>
      )}
    </AnimatedPage>
  );
});

export default MapPage;
