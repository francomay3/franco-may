import { memo } from "react";

const getWrapper = (as) => {
  switch (as) {
    case "h1":
      return ({ children, ...props }) => <h1 {...props}>{children}</h1>;
    case "h2":
      return ({ children, ...props }) => <h2 {...props}>{children}</h2>;
    case "h3":
      return ({ children, ...props }) => <h3 {...props}>{children}</h3>;
    case "h4":
      return ({ children, ...props }) => <h4 {...props}>{children}</h4>;
    case "h5":
      return ({ children, ...props }) => <h5 {...props}>{children}</h5>;
    case "h6":
      return ({ children, ...props }) => <h6 {...props}>{children}</h6>;
    case "p":
      return ({ children, ...props }) => <p {...props}>{children}</p>;
    case "span":
      return ({ children, ...props }) => <span {...props}>{children}</span>;
    default:
      return ({ children, ...props }) => <div {...props}>{children}</div>;
  }
};

const TextField = ({ value, isEditing, onChange, as }) => {
  const Wrapper = getWrapper(as);
  const handleBlur = (e) => {
    const newValue = e.target.innerHTML;
    if (newValue === value) return;
    onChange(newValue === "" ? "empty" : newValue);
  };
  return (
    <Wrapper
      onBlur={handleBlur}
      contentEditable={isEditing}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );
};

export default TextField;
