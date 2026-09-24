import React from 'react';
import { Text, TextProps } from '@mantine/core';

// Generated descriptions are a small Markdown: paragraphs split by a blank
// line and **bold** around a name. Register text has neither and renders as
// the single paragraph it always was.
const inline = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );

const DescriptionText = ({
  content,
  ...props
}: { content: string } & TextProps & { lang?: string }) => (
  <>
    {content
      .split(/\n\s*\n/)
      .filter(p => p.trim())
      .map((p, i) => (
        <Text key={i} {...props}>
          {inline(p.trim())}
        </Text>
      ))}
  </>
);

export default DescriptionText;
