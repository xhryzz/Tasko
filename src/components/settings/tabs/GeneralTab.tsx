import { systemInfo } from "../../../utils";
import CustomSwitch from "../CustomSwitch";

export default function GeneralTab() {
  return (
    <>
      <CustomSwitch
        settingKey="enableCategories"
        header="Habilitar Categorías"
        text="Habilita las categorías para organizar tus tareas."
      />
      <CustomSwitch
        settingKey="appBadge"
        header="Distintivo de la App"
        text="Muestra un distintivo en el icono de la PWA para indicar el número de tareas pendientes."
        disabled={!systemInfo.isPWA || !("setAppBadge" in navigator)}
        disabledReason="Esta función requiere que la app esté instalada como PWA y sea compatible con tu navegador."
      />
      <CustomSwitch
        settingKey="doneToBottom"
        header="Tareas Completadas al Final"
        text="Mueve las tareas completadas al final de la lista para mantener tus tareas activas más visibles."
      />
      <CustomSwitch
        settingKey="showProgressBar"
        header="Mostrar Barra de Progreso"
        text="Muestra una barra de progreso en la parte superior de la pantalla para visualizar la finalización de tus tareas."
      />
    </>
  );
}
