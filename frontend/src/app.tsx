import React, {useEffect} from "react";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import {ThemeProvider, CssBaseline} from "@mui/material";
import {observer} from "mobx-react-lite";
import theme from "./theme";
import rootStore from "./stores/root-store";
import AppShell from "./components/layout/app-shell";
import MapPage from "./pages/map-page";
import VotersListPage from "./pages/voters-list-page";
import VoterDetailPage from "./pages/voter-detail-page";
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
      <CssBaseline/>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<MapPage/>}/>
            <Route path="/voters" element={<VotersListPage/>}/>
            <Route path="/voters/:id" element={<VoterDetailPage/>}/>
            <Route path="/groups" element={<GroupsListPage/>}/>
            <Route path="/groups/:id" element={<GroupDetailPage/>}/>
            <Route path="/questions" element={<QuestionsListPage/>}/>
            <Route path="/questions/:id" element={<QuestionDetailPage/>}/>
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ThemeProvider>
  );
});

export default App;
