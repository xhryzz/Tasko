import { useContext, useEffect, useState } from "react";
import CustomRadioGroup from "../CustomRadioGroup";
import {
  SectionDescription,
  SectionHeading,
  StyledMenuItem,
  StyledSelect,
} from "../settings.styled";
import { UserContext } from "../../../contexts/UserContext";
import {
  BrightnessAutoRounded,
  DarkModeRounded,
  ExpandMoreRounded,
  LightModeRounded,
  MotionPhotosAutoRounded,
  MotionPhotosOffRounded,
  PersonalVideoRounded,
} from "@mui/icons-material";
import type { DarkModeOptions, ReduceMotionOption } from "../../../types/user";
import { SelectChangeEvent } from "@mui/material";
import { OPTION_ICON_SIZE } from "../settingsConstants";
import type { OptionItem } from "../settingsTypes";
import CustomSwitch from "../CustomSwitch";
import { useSystemTheme } from "../../../hooks/useSystemTheme";
import { Themes } from "../../../theme/createTheme";
import { ColorElement } from "../../../styles";

const darkModeOptions: OptionItem<DarkModeOptions>[] = [
  {
    label: "Automático",
    value: "auto",
    icon: <BrightnessAutoRounded sx={{ fontSize: OPTION_ICON_SIZE }} />,
  },
  {
    label: "Sistema",
    value: "system",
    icon: <PersonalVideoRounded sx={{ fontSize: OPTION_ICON_SIZE }} />,
  },
  {
    label: "Claro",
    value: "light",
    icon: <LightModeRounded sx={{ fontSize: OPTION_ICON_SIZE }} />,
  },
  {
    label: "Oscuro",
    value: "dark",
    icon: <DarkModeRounded sx={{ fontSize: OPTION_ICON_SIZE }} />,
  },
];

const reduceMotionOptions: OptionItem<ReduceMotionOption>[] = [
  {
    label: "Sistema",
    value: "system",
    icon: <PersonalVideoRounded sx={{ fontSize: OPTION_ICON_SIZE }} />,
  },
  {
    label: "Siempre",
    value: "on",
    icon: <MotionPhotosOffRounded sx={{ fontSize: OPTION_ICON_SIZE }} />,
  },
  {
    label: "Nunca",
    value: "off",
    icon: <MotionPhotosAutoRounded sx={{ fontSize: OPTION_ICON_SIZE }} />,
  },
];

export default function AppearanceTab() {
  const { user, setUser } = useContext(UserContext);
  const [darkModeValue, setDarkModeValue] = useState<DarkModeOptions>(user.darkmode);
  const [reduceMotionValue, setReduceMotionValue] = useState<ReduceMotionOption>(
    user.settings.reduceMotion,
  );

  const systemTheme = useSystemTheme();

  // actualizar estado local cuando cambia la configuración del usuario (ej. después de sincronización P2P)
  useEffect(() => {
    setDarkModeValue(user.darkmode);
  }, [user.darkmode, user.emojisStyle]);

  const handleAppThemeChange = (event: SelectChangeEvent<unknown>) => {
    const selectedTheme = event.target.value as string;
    setUser((prevUser) => ({
      ...prevUser,
      theme: selectedTheme,
    }));
  };

  return (
    <>
      <SectionHeading>Opciones de Modo Oscuro</SectionHeading>
      <CustomRadioGroup
        options={darkModeOptions}
        value={darkModeValue}
        onChange={(val) => {
          setDarkModeValue(val);
          setUser((prevUser) => ({
            ...prevUser,
            darkmode: val,
          }));
        }}
      />
      <SectionHeading>Selección de Tema</SectionHeading>
      <StyledSelect
        value={user.theme}
        onChange={handleAppThemeChange}
        IconComponent={ExpandMoreRounded}
      >
        <StyledMenuItem value="system">
          <PersonalVideoRounded />
          &nbsp; Sistema ({systemTheme === "dark" ? Themes[0].name : Themes[1].name})
        </StyledMenuItem>
        {Themes.map((theme) => (
          <StyledMenuItem key={theme.name} value={theme.name}>
            <ColorElement
              tabIndex={-1}
              clr={theme.MuiTheme.palette.primary.main}
              secondClr={theme.MuiTheme.palette.secondary.main}
              aria-label={`Cambiar tema - ${theme.name}`}
              size="24px"
              disableHover
            />
            &nbsp;
            {theme.name}
          </StyledMenuItem>
        ))}
      </StyledSelect>
      <SectionHeading>Opciones de Reducir Movimiento</SectionHeading>
      <SectionDescription>
        Reduce animaciones y transiciones para una experiencia más estable.
      </SectionDescription>
      <CustomRadioGroup
        options={reduceMotionOptions}
        value={reduceMotionValue}
        onChange={(val) => {
          setReduceMotionValue(val);
          setUser((prevUser) => ({
            ...prevUser,
            settings: {
              ...prevUser.settings,
              reduceMotion: val,
            },
          }));
        }}
      />
      <CustomSwitch
        settingKey="enableGlow"
        header="Habilitar Efecto de Resplandor"
        text="Añade un resplandor suave a las tareas para mejor visibilidad."
      />
    </>
  );
}