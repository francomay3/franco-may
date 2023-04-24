interface WrappIfProps {
  condition: boolean;
  Wrapper: React.ElementType;
  wrapperProps?: Record<string, unknown>;
  wrapperStyles?: Record<string, unknown>;
  children: React.ReactNode;
}

const WrappIf = ({
  condition,
  Wrapper,
  wrapperProps,
  wrapperStyles,
  children,
}: WrappIfProps) => {
  if (condition) {
    return (
      <Wrapper {...wrapperProps} style={wrapperStyles}>
        {children}
      </Wrapper>
    );
  }

  return <>{children}</>;
};

export default WrappIf;
