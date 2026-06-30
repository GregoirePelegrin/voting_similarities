import React, {useEffect} from "react";
import {observer} from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import VotersTable from "../components/voters/voters-table";
import {CardSkeleton} from "../components/shared/loading-skeleton";

const VotersListPage: React.FC = observer(() => {
  const {votersStore, uiStore} = rootStore;

  useEffect(() => {
    votersStore.fetchVoters();
  }, []);

  if (uiStore.loading && votersStore.voters.length === 0) {
    return (
      <AnimatedPage>
        <CardSkeleton/>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <VotersTable/>
    </AnimatedPage>
  );
});

export default VotersListPage;
