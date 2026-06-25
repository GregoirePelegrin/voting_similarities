import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { observer } from "mobx-react-lite";
import theme from "./theme";
import rootStore from "./stores/root-store";
import AppShell from "./components/layout/app-shell";
import MapPage from "./pages/map-page";
import PeopleListPage from "./pages/people-list-page";
import PersonDetailPage from "./pages/person-detail-page";
import GroupsListPage from "./pages/groups-list-page";
import GroupDetailPage from "./pages/group-detail-page";
import QuestionsListPage from "./pages/questions-list-page";
import QuestionDetailPage from "./pages/question-detail-page";

const App = observer(() => {
  useEffect(() => {
    rootStore.init();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/people" element={<PeopleListPage />} />
            <Route path="/people/:id" element={<PersonDetailPage />} />
            <Route path="/groups" element={<GroupsListPage />} />
            <Route path="/groups/:id" element={<GroupDetailPage />} />
            <Route path="/questions" element={<QuestionsListPage />} />
            <Route path="/questions/:id" element={<QuestionDetailPage />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ThemeProvider>
  );
});

export default App;
