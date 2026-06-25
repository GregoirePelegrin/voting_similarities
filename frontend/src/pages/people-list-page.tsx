import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import PeopleTable from "../components/people/people-table";
import { CardSkeleton } from "../components/shared/loading-skeleton";

const PeopleListPage: React.FC = observer(() => {
  const { people, ui } = rootStore;

  useEffect(() => {
    people.fetchPeople();
  }, []);

  if (ui.loading && people.people.length === 0) {
    return (
      <AnimatedPage>
        <CardSkeleton />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <PeopleTable />
    </AnimatedPage>
  );
});

export default PeopleListPage;
