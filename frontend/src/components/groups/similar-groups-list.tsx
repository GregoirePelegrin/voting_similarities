import React from "react";
import {Card, CardContent, Typography, Box} from "@mui/material";
import {SimilarGroupOut} from "../../api/types";
import SimilarityBar from "../shared/similarity-bar";
import {SIMILAR_GROUPS} from "../../constants/fr";

interface SimilarGroupsListProps {
  groups: SimilarGroupOut[];
}

const SimilarGroupsList: React.FC<SimilarGroupsListProps> = ({groups}) => {
  if (!groups || groups.length === 0) return null;
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{mb: 2}}>{SIMILAR_GROUPS.HEADING}</Typography>
        <Box>
          {groups.map((g) => (
            <Box key={g.id} sx={{mb: 1.5}}>
              <Box sx={{display: "flex", alignItems: "center", gap: 1, mb: 0.5}}>
                <Box sx={{width: 10, height: 10, borderRadius: "50%", bgcolor: g.color}}/>
                <Typography variant="body2">{g.name}</Typography>
              </Box>
              <SimilarityBar value={g.similarity} color={g.color}/>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SimilarGroupsList;
