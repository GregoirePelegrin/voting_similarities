import React from "react";
import { Card, CardContent, Typography, Chip, Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import { AnswerOut } from "../../api/types";

interface AnswerGridProps {
  answers: AnswerOut[];
}

const AnswerGrid: React.FC<AnswerGridProps> = observer(({ answers }) => {
  return (
    <Card sx={{ bgcolor: "background.paper" }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2 }}>Answers</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {answers.map((a) => (
            <Chip
              key={a.question_id}
              label={`Q${a.question_id}: ${a.value ? "Yes" : "No"}`}
              size="small"
              sx={{
                bgcolor: a.value ? "rgba(74,144,217,0.2)" : "rgba(255,255,255,0.06)",
                color: a.value ? "#4A90D9" : "text.secondary",
                border: `1px solid ${a.value ? "rgba(74,144,217,0.3)" : "rgba(255,255,255,0.1)"}`,
              }}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
});

export default AnswerGrid;
