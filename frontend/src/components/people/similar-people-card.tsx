import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { SimilarPersonOut } from "../../api/types";
import SimilarityBar from "../shared/similarity-bar";
import { SIMILAR_PEOPLE } from "../../constants/fr";

interface SimilarPeopleCardProps {
  title: string;
  people: SimilarPersonOut[];
  color: string;
  showSign?: boolean;
}

const SimilarPeopleCard: React.FC<SimilarPeopleCardProps> = ({ title, people: peopleList, color, showSign }) => {
    if (!peopleList || peopleList.length === 0) return null;
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
                  <Typography variant="body2">{p.firstname} {p.lastname}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.shared_count} {SIMILAR_PEOPLE.SHARED}
                  </Typography>
                </Box>
                <SimilarityBar value={p.similarity} color={showSign && p.similarity < 0 ? "#E15759" : color} showSign={showSign} />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
};

export default SimilarPeopleCard;
