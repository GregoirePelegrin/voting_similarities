import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Chip, Card, CardContent } from "@mui/material";
import { observer } from "mobx-react-lite";
import rootStore from "../stores/root-store";
import AnimatedPage from "../components/shared/animated-page";
import { CardSkeleton } from "../components/shared/loading-skeleton";
import { QUESTION_DETAIL } from "../constants/fr";
import { DATA_COLORS } from "../theme";

const QuestionDetailPage: React.FC = observer(() => {
  const { id } = useParams<{ id: string }>();
  const { questions } = rootStore;
  const questionId = Number(id);

  useEffect(() => {
      if (questionId) {
          questions.clearQuestionDetail();
      }
  }, [questionId]);

  useEffect(() => {
    if (questionId) {
      questions.fetchQuestion(questionId);
    }
  }, [questionId]);

  const q = questions.selectedQuestion;

  if (!q) {
    return (
      <AnimatedPage>
        <CardSkeleton />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>{q.text}</Typography>
        {q.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {q.description}
          </Typography>
        )}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Chip
            label={q.has_passed ? QUESTION_DETAIL.PASSED : QUESTION_DETAIL.NOT_PASSED}
            size="small"
            sx={{
              bgcolor: q.has_passed ? "rgba(89,161,79,0.2)" : "rgba(225,87,89,0.2)",
              color: q.has_passed ? DATA_COLORS.positive : DATA_COLORS.negative,
            }}
          />
          {q.category_names.map((cn) => (
            <Chip key={cn} label={cn} size="small" variant="outlined" />
          ))}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {QUESTION_DETAIL.YES_LABEL}: {q.total_yes} · {QUESTION_DETAIL.NO_LABEL}: {q.total_no} · {QUESTION_DETAIL.MISSING_LABEL}: {q.total_missing}
        </Typography>
      </Box>

      <Card sx={{ bgcolor: "background.paper", p: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>{QUESTION_DETAIL.GROUP_BREAKDOWN}</Typography>
          {q.group_stats.map((gs) => (
            <Box key={gs.group_id} sx={{ mb: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: gs.group_color }} />
                  <Typography variant="body2">{gs.group_name}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {gs.yes_count} {QUESTION_DETAIL.YES_LABEL} / {gs.no_count} {QUESTION_DETAIL.NO_LABEL} / {gs.missing_count} {QUESTION_DETAIL.MISSING_LABEL}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", height: 10, borderRadius: 1, overflow: "hidden" }}>
                <Box sx={{ width: `${gs.yes_rate * 100}%`, bgcolor: gs.group_color, opacity: 0.8 }} />
                <Box sx={{ flexGrow: 1, bgcolor: "rgba(255,255,255,0.08)" }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {(gs.yes_rate * 100).toFixed(0)}% {QUESTION_DETAIL.PCT_YES}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    </AnimatedPage>
  );
});

export default QuestionDetailPage;
