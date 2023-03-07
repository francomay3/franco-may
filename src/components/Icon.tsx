import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faX,
  faMoon,
  faSun,
  faQuestion,
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
} from "@fortawesome/free-solid-svg-icons";

function Icon({ id }: { id: string }) {
  switch (id) {
    case "menu":
      return <FontAwesomeIcon icon={faBars} />;
    case "x":
      return <FontAwesomeIcon icon={faX} />;
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
    default:
      return <FontAwesomeIcon icon={faQuestion} />;
  }
}

export default Icon;
