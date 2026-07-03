import React from "react";
import {Autocomplete, Chip, TextField} from "@mui/material";
import {observer} from "mobx-react-lite";
import rootStore from "../../stores/root-store";
import {CATEGORY_FILTER, EMBEDDINGS} from "../../constants/fr";
import {getVotersEmbeddings} from "../../api/embeddings";

const CategoryFilter: React.FC = observer(() => {
  const {categoriesStore, uiStore} = rootStore;
  const options = categoriesStore.categories.slice().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Autocomplete
      multiple
      size="small"
      sx={{minWidth: 300, maxWidth: 500}}
      options={options}
      value={options.filter(c => uiStore.selectedCategories.includes(c.id))}
      limitTags={3}
      disableCloseOnSelect
      onChange={async (_, selected) => {
        const ids = selected.map(c => c.id);
        if (ids.length <= 1) {
          uiStore.setCategories(ids);
          return;
        }
        try {
          const data = await getVotersEmbeddings(ids);
          if (data.points.length === 0 && data.shared_votes !== undefined && data.shared_votes < 2) {
            uiStore.showSnackbar(
              EMBEDDINGS.NO_DATA_BODY.replace("{count}", String(data.shared_votes)),
              "info"
            );
            return;
          }
        } catch {
          /* let normal error handling take over */
        }
        uiStore.setCategories(ids);
      }}
      getOptionLabel={(c) => c.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      renderInput={(params) => (
        <TextField {...params} label={CATEGORY_FILTER.LABEL} placeholder={CATEGORY_FILTER.ALL} />
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip {...getTagProps({index})} key={option.id} label={option.name} size="small" />
        ))
      }
    />
  );
});

export default CategoryFilter;
