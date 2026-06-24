import React from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { observer } from "mobx-react-lite";
import rootStore from "../../stores/root-store";

const CategoryFilter: React.FC = observer(() => {
  const { categories, ui } = rootStore;

  return (
    <FormControl size="small" sx={{ minWidth: 200 }}>
      <InputLabel>Category</InputLabel>
      <Select
        value={ui.selectedCategory ?? ""}
        label="Category"
        onChange={(e) => {
          const v = e.target.value;
          ui.setCategory(v === "" ? null : Number(v));
        }}
      >
        <MenuItem value="">
          <em>All categories</em>
        </MenuItem>
        {categories.categories.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
});

export default CategoryFilter;
