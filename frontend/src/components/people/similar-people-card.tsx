import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { observer } from "mobx-react-lite";
import { SimilarPersonOut } from "../../api/types";
import SimilarityBar from "../shared/similarity-bar";

interface SimilarPeopleCardProps {
  title: string;
  people: SimilarPersonOut[];
  color: string;
}

const SimilarPeopleCard: React.FC<SimilarPeopleCardProps> = observer(({ title, people: peopleList, color }) => {
  return (
    <Card sx={{ bgcolor: "background.paper", height: "100%" }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, color }}>
          {title}
        </Typography>
        <Box>
          {peopleList.map((p) => (
            <Box key={p.id} sx={{ mb: 1.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2">{p.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {p.shared_count} shared
                </Typography>
              </Box>
              <SimilarityBar value={p.similarity} color={color} />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
});

export default SimilarPeopleCard;
