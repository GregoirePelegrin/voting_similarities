import React, {useEffect} from "react";
import {observer} from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import GroupsTable from "../components/groups/groups-table";
import {CardSkeleton} from "../components/shared/loading-skeleton";

const GroupsListPage: React.FC = observer(() => {
  const {groupsStore, uiStore} = rootStore;

  useEffect(() => {
    groupsStore.fetchGroups();
  }, []);

  if (uiStore.loading && groupsStore.groups.length === 0) {
    return (
      <AnimatedPage>
        <CardSkeleton/>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <GroupsTable/>
    </AnimatedPage>
  );
});

export default GroupsListPage;
