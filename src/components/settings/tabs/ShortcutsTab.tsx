import { systemInfo } from "../../../utils";
import ShortcutItem from "../ShortcutItem";

export default function ShortcutsTab() {
  const cmdOrCtrl = systemInfo.isAppleDevice ? "Cmd" : "Ctrl";

  return (
    <>
      <ShortcutItem
        name="Exportación Rápida"
        description="Guardar todas las tareas y descargar como archivo JSON"
        keys={[cmdOrCtrl, "S"]}
      />
      <ShortcutItem
        name="Búsqueda Rápida"
        description="Enfocar el campo de búsqueda"
        keys={[cmdOrCtrl, "/"]}
      />
      <ShortcutItem
        name="Imprimir Tareas"
        description="Imprimir la lista actual de tareas"
        keys={[cmdOrCtrl, "P"]}
      />
      <ShortcutItem
        name="Cambiar Tema"
        description="Alternar entre modo claro y oscuro"
        keys={[cmdOrCtrl, "Shift", "L"]}
      />
      {/* <ShortcutItem
        name="Alternar Barra Lateral"
        description="Abrir o cerrar la barra lateral"
        keys={[cmdOrCtrl, "B"]}
      /> */}
    </>
  );
}
