import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, IconButton, Stack, TextField, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Create";
import UpgradeService from "../../services/UpgradeService";
import { addUnit, renameUnit } from "../../data/listSlice";
import { RootState } from "../../data/store";
import UnitService from "../../services/UnitService";
import { debounce } from "throttle-debounce";

const ENTER_KEY: number = 13;
const ESCAPE_KEY: number = 27;

export default function UpgradePanelHeader() {
  const list = useSelector((state: RootState) => state.list);
  const dispatch = useDispatch();
  const [editMode, setEditMode] = useState(false);
  const [customName, setCustomName] = useState("");

  const selectedUnit = list.unitPreview ?? UnitService.getSelected(list);
  const previewMode = !!list.unitPreview;

  useEffect(() => {
    setCustomName(selectedUnit?.customName ?? selectedUnit?.name ?? "");
  }, [selectedUnit?.selectionId]);

  const dispatchSave = (name: string) =>
    dispatch(renameUnit({ unitId: selectedUnit.selectionId, name }));
  const debounceSave = useCallback(
    debounce(1000, (name: string) => dispatchSave(name)),
    [list]
  );

  if (!selectedUnit) return null;

  const toggleEditMode = () => {
    const toggleTo = !editMode;
    setEditMode(toggleTo);
    if (toggleTo) {
      // Focus
    }
  };

  const saveName = (value: string, final: boolean) => {
    setCustomName(value);

    if (final) {
      dispatchSave(value);
      toggleEditMode();
    } else {
      debounceSave(value);
    }
  };

  return (
    <>
      <Stack direction="row" alignItems="center">
        <Stack direction="row" flex={1} alignItems="center">
          {editMode ? (
            <TextField
              autoFocus
              sx={{ flex: 1 }}
              variant="standard"
              value={customName}
              onChange={(e) => saveName(e.target.value, false)}
              onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                // if enter or escape key pressed, exit edit mode
                if (e.keyCode === ENTER_KEY || e.keyCode === ESCAPE_KEY) {
                  saveName((e.target as any).value, true);
                }
              }}
            />
          ) : (
            <Typography variant="h5">
              {selectedUnit.customName || selectedUnit.name}{" "}
              {`[${UnitService.getSize(selectedUnit)}]`}
            </Typography>
          )}
          {!previewMode && (
            <IconButton color="primary" className="ml-2" onClick={() => toggleEditMode()}>
              <EditIcon />
            </IconButton>
          )}
        </Stack>
        <Typography sx={{ ml: 1 }}>{UpgradeService.calculateUnitTotal(selectedUnit)}pts</Typography>
      </Stack>
      {previewMode && (
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 1 }}
          onClick={() => dispatch(addUnit(list.unitPreview))}
        >
          Add to My List
        </Button>
      )}
    </>
  );
}
