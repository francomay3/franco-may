import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faMoon,
  faSun,
  faQuestion,
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faFloppyDisk,
  faEarthAmericas,
  faXmark,
  faPlus,
  faMinus,
  faUpDownLeftRight,
  faPen,
  faUpload,
  faImage,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";

function Icon({ id }: { id: string }) {
  switch (id) {
    case "menu":
      return <FontAwesomeIcon icon={faBars} />;
    case "x":
      return <FontAwesomeIcon icon={faXmark} />;
    case "moon":
      return <FontAwesomeIcon icon={faMoon} />;
    case "sun":
      return <FontAwesomeIcon icon={faSun} />;
    case "bold":
      return <FontAwesomeIcon icon={faBold} />;
    case "italic":
      return <FontAwesomeIcon icon={faItalic} />;
    case "underline":
      return <FontAwesomeIcon icon={faUnderline} />;
    case "strikeThrough":
      return <FontAwesomeIcon icon={faStrikethrough} />;
    case "save":
      return <FontAwesomeIcon icon={faFloppyDisk} />;
    case "earth":
      return <FontAwesomeIcon icon={faEarthAmericas} />;
    case "invisible":
      return <FontAwesomeIcon icon={faEyeSlash} />;
    case "plus":
      return <FontAwesomeIcon icon={faPlus} />;
    case "minus":
      return <FontAwesomeIcon icon={faMinus} />;
    case "move":
      return <FontAwesomeIcon icon={faUpDownLeftRight} />;
    case "edit":
      return <FontAwesomeIcon icon={faPen} />;
    case "upload":
      return <FontAwesomeIcon icon={faUpload} />;
    case "image":
      return <FontAwesomeIcon icon={faImage} />;
    case "visible":
      return <FontAwesomeIcon icon={faEye} />;
    case "hidden":
      return <FontAwesomeIcon icon={faEyeSlash} />;
    default:
      return <FontAwesomeIcon icon={faQuestion} />;
  }
}

export const iconIds = [
  "menu",
  "x",
  "moon",
  "sun",
  "bold",
  "italic",
  "underline",
  "strikeThrough",
  "save",
  "earth",
  "invisible",
  "plus",
] as const;

export default Icon;
