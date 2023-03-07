import { useState } from "react";

function TextBlock({ block, isEditing, onChange = () => {} }) {
  const [blockState, setBlockState] = useState(block);
  const handleBlur = (e) => {
    setBlockState((prev) => {
      const newBlock = { ...prev, data: e.target.innerHTML };
      onChange(newBlock);
      return newBlock;
    });
  };

  return (
    <p
      onBlur={handleBlur}
      contentEditable={isEditing}
      dangerouslySetInnerHTML={{ __html: blockState.data }}
    />
  );
}

export default TextBlock;
