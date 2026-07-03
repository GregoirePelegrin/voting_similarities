import React from "react";
import {Accordion, AccordionSummary, AccordionDetails, Typography, Box} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export interface MetricSection {
  heading: string;
  body: string;
}

interface MetricInfoCardProps {
  sections: MetricSection[];
}

const MetricInfoCard: React.FC<MetricInfoCardProps> = ({sections}) => {
  if (sections.length === 0) return null;

  return (
    <Accordion sx={{bgcolor: "background.paper", mb: 2}}>
      <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
        <Typography variant="subtitle1" sx={{fontWeight: 500}}>
          Comprendre ces métriques
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        {sections.map((s, i) => (
          <Box key={i} sx={{mb: i < sections.length - 1 ? 2 : 0}}>
            <Typography variant="subtitle2" sx={{mb: 0.5, color: "primary.light"}}>
              {s.heading}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{whiteSpace: "pre-line"}}>
              {s.body}
            </Typography>
          </Box>
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

export default MetricInfoCard;