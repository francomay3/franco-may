import React from "react";

interface LabelProps {
  htmlFor: string;
  children: React.ReactNode;
}

const Label = ({ htmlFor, children }: LabelProps) => {
  return (
    <label htmlFor={htmlFor}>
      <h3
        style={{
          display: "inline",
        }}
      >
        {children}
      </h3>
    </label>
  );
};

export default Label;
