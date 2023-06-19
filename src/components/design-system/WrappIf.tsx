interface WrappIfProps {
  children: React.ReactNode;
  condition: boolean;
  elseWrapper?: (props: { children: React.ReactNode }) => JSX.Element;
  Wrapper: React.ElementType;
  wrapperClassName?: string;
  wrapperProps?: Record<string, unknown>;
  wrapperStyles?: Record<string, unknown>;
}

const WrappIf = ({
  condition,
  children,
  elseWrapper,
  Wrapper,
  wrapperProps,
  wrapperStyles,
}: WrappIfProps) => {
  if (condition) {
    return (
      <Wrapper {...wrapperProps} style={wrapperStyles}>
        {children}
      </Wrapper>
    );
  }

  if (elseWrapper) {
    return elseWrapper({ children });
  }

  return <>{children}</>;
};

export default WrappIf;
