import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import QuestionsTable from "../components/questions/questions-table";
import { CardSkeleton } from "../components/shared/loading-skeleton";

const QuestionsListPage: React.FC = observer(() => {
  const { questions, ui } = rootStore;

  useEffect(() => {
    questions.fetchQuestions();
  }, []);

  if (ui.loading && questions.questions.length === 0) {
    return (
      <AnimatedPage>
        <CardSkeleton />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <QuestionsTable />
    </AnimatedPage>
  );
});

export default QuestionsListPage;
