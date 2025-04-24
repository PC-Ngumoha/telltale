import { Dispatch, SetStateAction } from "react";

/**
 * Utility function: Read .txt files
 *
 * @param file
 * @param setter
 */
export default function scanTXTFile(file: File, setter: Dispatch<SetStateAction<string>>) {
  const reader = new FileReader();

  reader.onerror = () => {
    alert("Failed to read the file for unknown reasons");
  };

  reader.onload = () => {
    setter(reader.result as string);
  };

  reader.readAsText(file);
}
