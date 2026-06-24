import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import rootStore from "../../stores/root-store";
import SimilarityBar from "../shared/similarity-bar";

const GroupsTable: React.FC = observer(() => {
  const { groups } = rootStore;
  const navigate = useNavigate();

  return (
    <TableContainer component={Paper} sx={{ bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.08)" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Members</TableCell>
            <TableCell>Cohesivity</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {groups.groups.map((g) => (
            <TableRow
              key={g.id}
              hover
              onClick={() => navigate(`/groups/${g.id}`)}
              sx={{ cursor: "pointer", "&:hover": { bgcolor: "rgba(74,144,217,0.08)" } }}
            >
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: g.color }} />
                  <Typography variant="body2">{g.name}</Typography>
                </Box>
              </TableCell>
              <TableCell>{g.member_count}</TableCell>
              <TableCell sx={{ minWidth: 200 }}>
                {g.cohesivity != null ? (
                  <SimilarityBar value={g.cohesivity} color={g.color} />
                ) : (
                  <Typography variant="body2" color="text.secondary">—</Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

export default GroupsTable;
