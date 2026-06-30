import React, {useEffect} from "react";
import {Box} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import {CardSkeleton} from "../components/shared/loading-skeleton";
import CategoryFilter from "../components/shared/category-filter";
import PeopleScatter from "../components/map/people-scatter";
import GroupsScatter from "../components/map/groups-scatter";
import MethodologyPanel from "../components/map/methodology-panel";

const MapPage: React.FC = observer(() => {
  const {embeddingsStore, uiStore} = rootStore;

  useEffect(() => {
    embeddingsStore.fetchPeopleEmbedding(uiStore.selectedCategory);
    embeddingsStore.fetchGroupsEmbedding(uiStore.selectedCategory);
  }, [uiStore.selectedCategory]);

  const isLoading = !embeddingsStore.peopleEmbedding && !embeddingsStore.groupsEmbedding;

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
            embeddingsStore.peopleEmbedding ? (
              <PeopleScatter
                points={embeddingsStore.peopleEmbedding.points}
                barycenters={embeddingsStore.peopleEmbedding.barycenters}
                stress={embeddingsStore.peopleEmbedding.stress}
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
