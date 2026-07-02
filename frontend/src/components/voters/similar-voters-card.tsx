import React from "react";
import {useNavigate} from "react-router-dom";
import {Card, CardContent, Typography, Box} from "@mui/material";
import {SimilarVoterOut} from "../../api/types";
import SimilarityBar from "../shared/similarity-bar";
import {SIMILAR_VOTERS} from "../../constants/fr";

interface SimilarVotersCardProps {
  title: string;
  voters: SimilarVoterOut[];
  color: string;
  showSign?: boolean;
  getGroupColor?: (voterId: number) => string | undefined;
}

const SimilarVotersCard: React.FC<SimilarVotersCardProps> = ({title, voters: votersList, color, showSign, getGroupColor}) => {
  const navigate = useNavigate();
  if (!votersList || votersList.length === 0) return null;
  return (
    <Card sx={{height: "100%"}}>
      <CardContent>
        <Typography variant="h6" sx={{mb: 2, color}}>
          {title}
        </Typography>
        <Box>
          {votersList.map((p) => {
            const barColor = getGroupColor?.(p.id) || (showSign && p.similarity < 0 ? "#E15759" : color);
            return (
              <Box
                key={p.id}
                sx={{mb: 1.5, cursor: "pointer"}}
                onClick={() => navigate(`/voters/${p.id}`)}
              >
                <Box sx={{display: "flex", justifyContent: "space-between", mb: 0.5}}>
                  <Typography variant="body2">{p.firstname} {p.lastname}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.shared_count} {SIMILAR_VOTERS.SHARED}
                  </Typography>
                </Box>
                <SimilarityBar value={p.similarity} color={barColor} showSign={showSign}/>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SimilarVotersCard;
