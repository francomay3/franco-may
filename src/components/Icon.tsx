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
  faEyeSlash,
  faXmark,
  faPlus,
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
