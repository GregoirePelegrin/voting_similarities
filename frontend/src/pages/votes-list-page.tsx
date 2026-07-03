import React, {useEffect} from "react";
import {observer} from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import VotesTable from "../components/votes/votes-table";
import {CardSkeleton} from "../components/shared/loading-skeleton";

const VotesListPage: React.FC = observer(() => {
  const {votesStore, uiStore} = rootStore;

  useEffect(() => {
    votesStore.fetchVotes();
  }, [uiStore.retryVersion]);

  if (uiStore.loading && votesStore.votes.length === 0) {
    return (
      <AnimatedPage>
        <CardSkeleton/>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <VotesTable/>
    </AnimatedPage>
  );
});

export default VotesListPage;
