import styled from "@emotion/styled";
import { CancelRounded, EditCalendarRounded, SaveRounded } from "@mui/icons-material";
import {
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  InputAdornment,
  TextField,
  TextFieldProps,
  Tooltip,
} from "@mui/material";
import { useContext, useEffect, useMemo, useState } from "react";
import { ColorPicker, CustomDialogTitle, CustomEmojiPicker } from "..";
import { DESCRIPTION_MAX_LENGTH, TASK_NAME_MAX_LENGTH } from "../../constants";
import { UserContext } from "../../contexts/UserContext";
import { DialogBtn } from "../../styles";
import { Category, Task } from "../../types/user";
import { formatDate, showToast, timeAgo } from "../../utils";
import { useTheme } from "@emotion/react";
import { ColorPalette } from "../../theme/themeConfig";
import { CategorySelect } from "../CategorySelect";

interface EditTaskProps {
  open: boolean;
  task?: Task;
  onClose: () => void;
}

export const EditTask = ({ open, task, onClose }: EditTaskProps) => {
  const { user, setUser } = useContext(UserContext);
  const { settings } = user;
  const [editedTask, setEditedTask] = useState<Task | undefined>(task);
  const [emoji, setEmoji] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);

  const theme = useTheme();

  const nameError = useMemo(
    () => (editedTask?.name ? editedTask.name.length > TASK_NAME_MAX_LENGTH : undefined),
    [editedTask?.name],
  );
  const descriptionError = useMemo(
    () =>
      editedTask?.description ? editedTask.description.length > DESCRIPTION_MAX_LENGTH : undefined,
    [editedTask?.description],
  );

  // Hook de efecto para actualizar la tarea editada con el emoji seleccionado.
  useEffect(() => {
    setEditedTask((prevTask) => ({
      ...(prevTask as Task),
      emoji: emoji || undefined,
    }));
  }, [emoji]);

  // Hook de efecto para actualizar la tarea editada cuando cambia la prop task.
  useEffect(() => {
    setEditedTask(task);
    setSelectedCategories(task?.category as Category[]);
  }, [task]);

  // Manejador de eventos para cambios en los campos del formulario.
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    // Actualizar el estado de la tarea editada con el valor cambiado.
    setEditedTask((prevTask) => ({
      ...(prevTask as Task),
      [name]: value,
    }));
  };
  // Manejador de eventos para guardar la tarea editada.
  const handleSave = () => {
    document.body.style.overflow = "auto";
    if (editedTask && !nameError && !descriptionError) {
      const updatedTasks = user.tasks.map((task) => {
        if (task.id === editedTask.id) {
          return {
            ...task,
            name: editedTask.name,
            color: editedTask.color,
            emoji: editedTask.emoji || undefined,
            description: editedTask.description || undefined,
            deadline: editedTask.deadline || undefined,
            category: editedTask.category || undefined,
            lastSave: new Date(),
          };
        }
        return task;
      });
      setUser((prevUser) => ({
        ...prevUser,
        tasks: updatedTasks,
      }));
      onClose();
      showToast(
        <div>
          Tarea <b translate="no">{editedTask.name}</b> actualizada.
        </div>,
      );
    }
  };

  const handleCancel = () => {
    onClose();
    setEditedTask(task);
    setSelectedCategories(task?.category as Category[]);
  };

  useEffect(() => {
    setEditedTask((prevTask) => ({
      ...(prevTask as Task),
      category: (selectedCategories as Category[]) || undefined,
    }));
  }, [selectedCategories]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(editedTask) !== JSON.stringify(task) && open) {
        const message = "Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [editedTask, open, task]);

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose();
      }}
      slotProps={{
        paper: {
          style: {
            borderRadius: "24px",
            padding: "12px",
            maxWidth: "600px",
          },
        },
      }}
    >
      <CustomDialogTitle
        title="Editar Tarea"
        subTitle={
          editedTask?.lastSave
            ? `Última edición ${timeAgo(new Date(editedTask.lastSave))} • ${formatDate(new Date(editedTask.lastSave))}`
            : "Edita los detalles de la tarea."
        }
        icon={<EditCalendarRounded />}
        onClose={onClose}
      />
      <DialogContent>
        <CustomEmojiPicker
          emoji={editedTask?.emoji || undefined}
          setEmoji={setEmoji}
          color={editedTask?.color}
          name={editedTask?.name || ""}
          type="task"
        />
        <StyledInput
          label="Nombre"
          name="name"
          autoComplete="off"
          value={editedTask?.name || ""}
          onChange={handleInputChange}
          error={nameError || editedTask?.name === ""}
          helperText={
            editedTask?.name
              ? editedTask?.name.length === 0
                ? "El nombre es requerido"
                : editedTask?.name.length > TASK_NAME_MAX_LENGTH
                  ? `El nombre es demasiado largo (máximo ${TASK_NAME_MAX_LENGTH} caracteres)`
                  : `${editedTask?.name?.length}/${TASK_NAME_MAX_LENGTH}`
              : "El nombre es requerido"
          }
        />
        <StyledInput
          label="Descripción"
          name="description"
          autoComplete="off"
          value={editedTask?.description || ""}
          onChange={handleInputChange}
          multiline
          rows={4}
          margin="normal"
          error={descriptionError}
          helperText={
            editedTask?.description === "" || editedTask?.description === undefined
              ? undefined
              : descriptionError
                ? `La descripción es demasiado larga (máximo ${DESCRIPTION_MAX_LENGTH} caracteres)`
                : `${editedTask?.description?.length}/${DESCRIPTION_MAX_LENGTH}`
          }
        />
        <StyledInput
          label="Fecha límite"
          name="deadline"
          type="datetime-local"
          value={
            editedTask?.deadline
              ? new Date(editedTask.deadline).toLocaleString("sv").replace(" ", "T").slice(0, 16)
              : ""
          }
          onChange={handleInputChange}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
            input: {
              startAdornment: editedTask?.deadline ? (
                <InputAdornment position="start">
                  <Tooltip title="Limpiar">
                    <IconButton
                      color="error"
                      onClick={() => {
                        setEditedTask((prevTask) => ({
                          ...(prevTask as Task),
                          deadline: undefined,
                        }));
                      }}
                    >
                      <CancelRounded />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ) : undefined,
            },
          }}
          sx={{
            colorScheme: theme.darkmode ? "dark" : "light",
            " & .MuiInputBase-root": {
              transition: ".3s all",
            },
          }}
        />

        {settings.enableCategories !== undefined && settings.enableCategories && (
          <CategorySelect
            fontColor={theme.darkmode ? ColorPalette.fontLight : ColorPalette.fontDark}
            selectedCategories={selectedCategories}
            onCategoryChange={(categories) => setSelectedCategories(categories)}
          />
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginTop: "8px",
          }}
        >
          <ColorPicker
            width={"100%"}
            color={editedTask?.color || "#000000"}
            fontColor={theme.darkmode ? ColorPalette.fontLight : ColorPalette.fontDark}
            onColorChange={(color) => {
              setEditedTask((prevTask) => ({
                ...(prevTask as Task),
                color: color,
              }));
            }}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <DialogBtn onClick={handleCancel}>Cancelar</DialogBtn>
        <DialogBtn
          onClick={handleSave}
          color="primary"
          disabled={
            nameError ||
            editedTask?.name === "" ||
            descriptionError ||
            nameError ||
            JSON.stringify(editedTask) === JSON.stringify(task)
          }
        >
          <SaveRounded /> &nbsp; Guardar
        </DialogBtn>
      </DialogActions>
    </Dialog>
  );
};

const UnstyledTextField = ({ ...props }: TextFieldProps) => <TextField fullWidth {...props} />;

const StyledInput = styled(UnstyledTextField)`
  margin: 14px 0;
  & .MuiInputBase-root {
    border-radius: 16px;
  }
`;