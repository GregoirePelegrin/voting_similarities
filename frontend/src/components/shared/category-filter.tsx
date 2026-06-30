import React from "react";
import {FormControl, InputLabel, MenuItem, Select} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../../stores/root-store";
import {CATEGORY_FILTER} from "../../constants/fr";

const CategoryFilter: React.FC = observer(() => {
  const {categoriesStore, uiStore} = rootStore;

  return (
    <FormControl size="small" sx={{minWidth: 200}}>
      <InputLabel>{CATEGORY_FILTER.LABEL}</InputLabel>
      <Select
        value={uiStore.selectedCategory ?? ""}
        label={CATEGORY_FILTER.LABEL}
        onChange={(e) => {
          const v = e.target.value;
          uiStore.setCategory(v === "" ? null : Number(v));
        }}
      >
        <MenuItem value="">
          <em>{CATEGORY_FILTER.ALL}</em>
        </MenuItem>
        {categoriesStore.categories.map((c) => (
          <MenuItem key={c.id} value={c.id}>
            {c.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
});

export default CategoryFilter;
