import React, {useEffect} from "react";
import {Box} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import {CardSkeleton} from "../components/shared/loading-skeleton";
import CategoryFilter from "../components/shared/category-filter";
import EmbeddingScatter from "../components/map/embedding-scatter";
import GroupsScatter from "../components/map/groups-scatter";
import MethodologyPanel from "../components/map/methodology-panel";
import {filterAnnotation} from "../constants/fr";

const MapPage: React.FC = observer(() => {
  const {embeddingsStore, uiStore, categoriesStore, similarityConfig} = rootStore;

  useEffect(() => {
    embeddingsStore.fetchVotersEmbedding(uiStore.selectedCategories);
    embeddingsStore.fetchGroupsEmbedding(uiStore.selectedCategories);
  }, [uiStore.categoriesKey, uiStore.retryVersion]);

  const isLoading = !embeddingsStore.votersEmbedding && !embeddingsStore.groupsEmbedding;
  const categoriesLabel = filterAnnotation(
    uiStore.selectedCategories
      .map(id => categoriesStore.categories.find(c => c.id === id)?.name)
      .filter((n): n is string => !!n)
  );

  return (
    <AnimatedPage>
      <Box sx={{mb: 2}}>
        <CategoryFilter/>
      </Box>
      <MethodologyPanel config={similarityConfig}/>
      {isLoading ? (
        <CardSkeleton/>
      ) : (
        <>
          {
            embeddingsStore.votersEmbedding ? (
              <EmbeddingScatter
                points={embeddingsStore.votersEmbedding.points}
                barycenters={embeddingsStore.votersEmbedding.barycenters}
                stress={embeddingsStore.votersEmbedding.stress}
                categoriesLabel={categoriesLabel}
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
                categoriesLabel={categoriesLabel}
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
