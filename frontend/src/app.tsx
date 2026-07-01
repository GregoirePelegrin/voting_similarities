import React, {Suspense, useEffect} from "react";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import {ThemeProvider, CssBaseline} from "@mui/material";
import {observer} from "mobx-react-lite";
import theme from "./theme";
import rootStore from "./stores/root-store";
import AppShell from "./components/layout/app-shell";
import {CardSkeleton} from "./components/shared/loading-skeleton";

const MapPage = React.lazy(() => import("./pages/map-page"));
const VotersListPage = React.lazy(() => import("./pages/voters-list-page"));
const VoterDetailPage = React.lazy(() => import("./pages/voter-detail-page"));
const GroupsListPage = React.lazy(() => import("./pages/groups-list-page"));
const GroupDetailPage = React.lazy(() => import("./pages/group-detail-page"));
const QuestionsListPage = React.lazy(() => import("./pages/questions-list-page"));
const QuestionDetailPage = React.lazy(() => import("./pages/question-detail-page"));

const App = observer(() => {
  useEffect(() => {
    rootStore.init();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <BrowserRouter>
        <AppShell>
          <Suspense fallback={<CardSkeleton/>}>
            <Routes>
              <Route path="/" element={<MapPage/>}/>
              <Route path="/voters" element={<VotersListPage/>}/>
              <Route path="/voters/:id" element={<VoterDetailPage/>}/>
              <Route path="/groups" element={<GroupsListPage/>}/>
              <Route path="/groups/:id" element={<GroupDetailPage/>}/>
              <Route path="/questions" element={<QuestionsListPage/>}/>
              <Route path="/questions/:id" element={<QuestionDetailPage/>}/>
            </Routes>
          </Suspense>
        </AppShell>
      </BrowserRouter>
    </ThemeProvider>
  );
});

export default App;
