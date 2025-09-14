import { Emoji, EmojiStyle } from "emoji-picker-react";
import CustomRadioGroup from "../CustomRadioGroup";
import { SectionDescription, SectionHeading } from "../settings.styled";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../contexts/UserContext";
import { DeleteRounded, WifiOffRounded } from "@mui/icons-material";
import { Alert, AlertTitle, Button } from "@mui/material";
import CustomSwitch from "../CustomSwitch";
import { showToast } from "../../../utils";
import type { OptionItem } from "../settingsTypes";
import { OPTION_ICON_SIZE } from "../settingsConstants";

const emojiStyles: OptionItem<EmojiStyle>[] = [
  { label: "Apple", value: EmojiStyle.APPLE },
  { label: "Facebook", value: EmojiStyle.FACEBOOK },
  { label: "Discord", value: EmojiStyle.TWITTER },
  { label: "Google", value: EmojiStyle.GOOGLE },
  { label: "Native", value: EmojiStyle.NATIVE },
].map(({ label, value }) => ({
  label,
  value,
  icon: <Emoji emojiStyle={value} unified="1f60e" size={OPTION_ICON_SIZE} />,
}));

const offlineDisabledEmojiStyles = emojiStyles
  .map((option) => option.value)
  .filter((value) => value !== EmojiStyle.NATIVE);

export default function EmojiTab() {
  const { user, setUser } = useContext(UserContext);
  const [emojiStyleValue, setEmojiStyleValue] = useState<EmojiStyle>(user.emojisStyle);
  const [hasEmojiData, setHasEmojiData] = useState<boolean>(
    !!localStorage.getItem("epr_suggested"),
  );

  const isOnline = useOnlineStatus();
  useEffect(() => {
    setEmojiStyleValue(user.emojisStyle);
  }, [user.darkmode, user.emojisStyle]);

  return (
    <>
      <SectionHeading>Estilo de Emoji</SectionHeading>
      <CustomRadioGroup
        options={emojiStyles}
        value={emojiStyleValue}
        onChange={(val) => {
          setEmojiStyleValue(val);
          setUser((prevUser) => ({
            ...prevUser,
            emojisStyle: val,
          }));
        }}
        disabledOptions={isOnline ? [] : offlineDisabledEmojiStyles}
      />

      {!isOnline && (
        <Alert severity="warning" sx={{ mt: "8px" }} icon={<WifiOffRounded />}>
          <AlertTitle>Modo Sin Conexión</AlertTitle>
          Actualmente estás sin conexión. Los estilos de emoji no nativos pueden no cargarse.
        </Alert>
      )}

      <CustomSwitch
        settingKey="simpleEmojiPicker"
        header="Selector de Emoji Simple"
        text="Mostrar solo los emojis recientes para una carga más rápida."
        disabled={!hasEmojiData}
        disabledReason="No hay emojis recientes disponibles."
      />

      <SectionHeading>Datos de Emoji</SectionHeading>
      <SectionDescription> Borrar datos de emojis usados recientemente</SectionDescription>
      <Button
        variant="contained"
        color="error"
        onClick={() => {
          localStorage.removeItem("epr_suggested");
          showToast("Datos de emojis eliminados.");
          setHasEmojiData(false);
          if (user.settings.simpleEmojiPicker) {
            setUser((prev) => ({
              ...prev,
              settings: { ...prev.settings, simpleEmojiPicker: false },
            }));
          }
        }}
      >
        <DeleteRounded /> &nbsp; Borrar Datos de Emoji
      </Button>
    </>
  );
}
