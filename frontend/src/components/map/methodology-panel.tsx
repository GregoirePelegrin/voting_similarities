import React from "react";
import {Accordion, AccordionSummary, AccordionDetails, Typography, Box, Chip} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import {METHODOLOGY} from "../../constants/fr";
import {DATA_COLORS} from "../../theme";

const MethodologyPanel: React.FC = () => {
  return (
    <Accordion sx={{bgcolor: "background.paper", mb: 2}}>
      <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
        <Typography variant="subtitle1" sx={{fontWeight: 500}}>
          {METHODOLOGY.ACCORDION_LABEL}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{"& p": {mb: 2}, "& h6": {mt: 1, mb: 0.5}}}>
        <Typography variant="h6">{METHODOLOGY.WHAT_YOU_SEE_HEADING}</Typography>
        <Typography variant="body2">
          {METHODOLOGY.WHAT_YOU_SEE_BODY.split("**").map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
          )}
        </Typography>

        <Typography variant="h6">{METHODOLOGY.WHY_MDS_HEADING}</Typography>
        <Typography variant="body2">
          {METHODOLOGY.WHY_MDS_BODY.split("**").map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
          )}
        </Typography>

        <Typography variant="h6">{METHODOLOGY.METRIC_HEADING}</Typography>
        <Typography variant="body2">
          {METHODOLOGY.METRIC_INTRO}
        </Typography>
        <Box sx={{pl: 2, mb: 2}}>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label={METHODOLOGY.YES_YES_LABEL} size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(74,144,217,0.2)", color: DATA_COLORS.primary}}/>
            {METHODOLOGY.YES_YES_DESC}
          </Box>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label={METHODOLOGY.NO_NO_LABEL} size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(255,255,255,0.08)", color: DATA_COLORS.neutral}}/>
            {METHODOLOGY.NO_NO_DESC}
          </Box>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label={METHODOLOGY.DISAGREE_LABEL} size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(225,87,89,0.2)", color: DATA_COLORS.negative}}/>
            {METHODOLOGY.DISAGREE_DESC}
          </Box>
        </Box>
        <Typography variant="body2">
          {METHODOLOGY.SHRINKAGE_BODY}
        </Typography>

        <Typography variant="h6">{METHODOLOGY.STRESS_HEADING}</Typography>
        <Typography variant="body2">
          {METHODOLOGY.STRESS_INTRO.split("**").map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
          )}
        </Typography>
        <Box sx={{pl: 2, mb: 2}}>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label="< 10%" size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(89,161,79,0.2)", color: DATA_COLORS.positive}}/>
            {METHODOLOGY.STRESS_GOOD}
          </Box>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label="10–20%" size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(237,201,72,0.2)", color: DATA_COLORS.warning}}/>
            {METHODOLOGY.STRESS_FAIR}
          </Box>
          <Box sx={{typography: "body2", mb: 0.5, display: "flex", alignItems: "center"}}>
            <Chip label="≥ 20%" size="small"
                  sx={{mr: 0.5, bgcolor: "rgba(225,87,89,0.2)", color: DATA_COLORS.negative}}/>
            {METHODOLOGY.STRESS_POOR}
          </Box>
        </Box>

        <Typography variant="h6">{METHODOLOGY.BARYCENTER_HEADING}</Typography>
        <Typography variant="body2">
          {METHODOLOGY.BARYCENTER_BODY.split("**").map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
          )}
        </Typography>

        <Typography variant="h6">{METHODOLOGY.PER_CATEGORY_HEADING}</Typography>
        <Typography variant="body2">
          {METHODOLOGY.PER_CATEGORY_BODY}
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
};

export default MethodologyPanel;
